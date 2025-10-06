# C# WinForms + WebView2 Integration Guide

## 🎯 Інтеграція React з C# WinForms через WebView2

### 📋 Структура інтеграції:
- **Frontend:** React (поточний код в `/workspace/shadcn-ui`)
- **Desktop Container:** C# WinForms з WebView2 контролом
- **Backend:** C# бізнес-логіка + SQLite (ваш існуючий код SC)
- **Bridge:** JavaScript ↔ C# через WebView2 API

---

## 🔧 C# WinForms Implementation

### 1. Form1.cs - Основна форма з WebView2

```csharp
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using System.Text.Json;
using SC.Data.Repositories;
using SC.Models;

namespace SC
{
    public partial class Form1 : Form
    {
        private WebView2 webView;
        private GameRepository gameRepository;
        private TeamRepository teamRepository;

        public Form1()
        {
            InitializeComponent();
            InitializeRepositories();
            InitializeWebView();
        }

        private void InitializeRepositories()
        {
            gameRepository = new GameRepository();
            teamRepository = new TeamRepository();
        }

        private async void InitializeWebView()
        {
            // Створюємо WebView2 контрол
            webView = new WebView2()
            {
                Dock = DockStyle.Fill
            };
            
            this.Controls.Add(webView);
            
            // Ініціалізуємо WebView2
            await webView.EnsureCoreWebView2Async();
            
            // Налаштовуємо обробник повідомлень з React
            webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            
            // Дозволяємо CORS для розробки
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            
            // Завантажуємо React додаток (dev server)
            webView.CoreWebView2.Navigate("http://localhost:5173");
            
            // Альтернативно: завантажуємо build версію
            // string appPath = Path.Combine(Application.StartupPath, "dist", "index.html");
            // webView.CoreWebView2.Navigate($"file:///{appPath}");
        }

        private async void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var messageJson = e.TryGetWebMessageAsString();
                var message = JsonSerializer.Deserialize<WebViewMessage>(messageJson);
                
                var response = await HandleMessage(message);
                var responseJson = JsonSerializer.Serialize(response);
                
                await webView.CoreWebView2.PostWebMessageAsJsonAsync(responseJson);
            }
            catch (Exception ex)
            {
                var errorResponse = new WebViewResponse
                {
                    MessageId = 0,
                    Success = false,
                    Error = ex.Message
                };
                
                var errorJson = JsonSerializer.Serialize(errorResponse);
                await webView.CoreWebView2.PostWebMessageAsJsonAsync(errorJson);
            }
        }

        private async Task<WebViewResponse> HandleMessage(WebViewMessage message)
        {
            var response = new WebViewResponse
            {
                MessageId = message.MessageId,
                Success = true
            };

            try
            {
                switch (message.Method)
                {
                    case "getAllGames":
                        var games = gameRepository.GetAllGames();
                        response.Data = games;
                        break;

                    case "getAllTeams":
                        var teams = teamRepository.GetAllTeams();
                        response.Data = teams;
                        break;

                    case "getGamesByTeam":
                        var teamName = message.Params?.GetProperty("teamName").GetString();
                        var teamGames = gameRepository.GetGamesByTeam(teamName);
                        response.Data = teamGames;
                        break;

                    case "getGameDetails":
                        var gameLink = message.Params?.GetProperty("gameLink").GetString();
                        // Implement game details retrieval
                        response.Data = new List<object>(); // Placeholder
                        break;

                    case "insertGame":
                        var gameJson = message.Params?.GetProperty("game").GetRawText();
                        var game = JsonSerializer.Deserialize<Game>(gameJson);
                        gameRepository.InsertGameIfNotExists(game);
                        response.Data = true;
                        break;

                    default:
                        response.Success = false;
                        response.Error = $"Unknown method: {message.Method}";
                        break;
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Error = ex.Message;
            }

            return response;
        }
    }

    // Message classes for WebView2 communication
    public class WebViewMessage
    {
        public int MessageId { get; set; }
        public string Method { get; set; }
        public JsonElement? Params { get; set; }
    }

    public class WebViewResponse
    {
        public int MessageId { get; set; }
        public bool Success { get; set; }
        public object Data { get; set; }
        public string Error { get; set; }
    }
}
```

### 2. Program.cs - Entry Point

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SC
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            // Ініціалізуємо WebView2 runtime
            Application.Run(new Form1());
        }
    }
}
```

### 3. SC.csproj - Project Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2210.55" />
    <PackageReference Include="System.Data.SQLite" Version="1.0.118" />
    <PackageReference Include="System.Text.Json" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <None Update="db.db">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>

</Project>
```

---

## 📊 Repository Extensions для аналітики

### GameRepository.cs - Додаткові методи

```csharp
// Додайте ці методи до вашого GameRepository.cs

public List<Game> GetRecentGames(int count = 50)
{
    using var connection = DbContext.GetConnection();
    connection.Open();

    var sql = "SELECT * FROM Game ORDER BY Date DESC LIMIT @Count";
    using var cmd = new SQLiteCommand(sql, connection);
    cmd.Parameters.AddWithValue("@Count", count);

    using var reader = cmd.ExecuteReader();
    var result = new List<Game>();

    while (reader.Read())
    {
        result.Add(ReadGameFromReader(reader));
    }

    return result;
}

public Dictionary<string, int> GetTeamWinStats()
{
    using var connection = DbContext.GetConnection();
    connection.Open();

    var sql = @"
        SELECT Team1 as Team, COUNT(*) as Wins 
        FROM Game 
        WHERE Score1 > Score2 
        GROUP BY Team1
        UNION ALL
        SELECT Team2 as Team, COUNT(*) as Wins 
        FROM Game 
        WHERE Score2 > Score1 
        GROUP BY Team2";

    using var cmd = new SQLiteCommand(sql, connection);
    using var reader = cmd.ExecuteReader();

    var stats = new Dictionary<string, int>();
    while (reader.Read())
    {
        var team = reader.GetString("Team");
        var wins = reader.GetInt32("Wins");
        
        if (stats.ContainsKey(team))
            stats[team] += wins;
        else
            stats[team] = wins;
    }

    return stats;
}

public List<Game> GetGamesByDateRange(DateTime startDate, DateTime endDate)
{
    using var connection = DbContext.GetConnection();
    connection.Open();

    var sql = "SELECT * FROM Game WHERE Date BETWEEN @StartDate AND @EndDate ORDER BY Date DESC";
    using var cmd = new SQLiteCommand(sql, connection);
    cmd.Parameters.AddWithValue("@StartDate", startDate);
    cmd.Parameters.AddWithValue("@EndDate", endDate);

    using var reader = cmd.ExecuteReader();
    var result = new List<Game>();

    while (reader.Read())
    {
        result.Add(ReadGameFromReader(reader));
    }

    return result;
}
```

---

## 🚀 Deployment Instructions

### 1. Build React Application
```bash
cd /workspace/shadcn-ui
npm run build
```

### 2. Copy React Build to C# Project
```bash
# Скопіюйте папку dist в ваш C# проект
cp -r dist/ ../SC/SC/wwwroot/
```

### 3. Update WebView2 Navigation
```csharp
// В InitializeWebView() замініть:
// webView.CoreWebView2.Navigate("http://localhost:5173");

// На:
string appPath = Path.Combine(Application.StartupPath, "wwwroot", "index.html");
webView.CoreWebView2.Navigate($"file:///{appPath}");
```

### 4. Build C# Application
```bash
cd SC
dotnet build --configuration Release
dotnet publish --configuration Release --self-contained true
```

---

## 🔧 Development Workflow

### 1. Розробка React (Hot Reload)
```bash
cd /workspace/shadcn-ui
npm run dev
# React працює на http://localhost:5173
```

### 2. Запуск C# WinForms
```bash
cd SC
dotnet run
# WebView2 завантажує http://localhost:5173
```

### 3. Production Build
```bash
# 1. Build React
cd /workspace/shadcn-ui
npm run build

# 2. Copy to C#
cp -r dist/* ../SC/SC/wwwroot/

# 3. Build C#
cd ../SC
dotnet publish -c Release
```

---

## 📋 Testing Integration

### 1. Test WebView2 Communication
```javascript
// В React DevTools Console:
window.chrome.webview.postMessage(JSON.stringify({
  messageId: 1,
  method: 'getAllGames',
  params: {}
}));
```

### 2. Test C# Response
```csharp
// Додайте логування в OnWebMessageReceived:
Console.WriteLine($"Received: {messageJson}");
Console.WriteLine($"Sending: {responseJson}");
```

---

## ✅ Integration Checklist

- [ ] WebView2 NuGet package встановлено
- [ ] React build копіюється в C# проект
- [ ] WebView2 контрол додано до форми
- [ ] Message handlers налаштовано
- [ ] Repository methods працюють
- [ ] SQLite база даних доступна
- [ ] CORS налаштовано для розробки
- [ ] Production build тестується

---

## 🎯 Next Steps

1. **Тестування інтеграції** - перевірити всі API endpoints
2. **Error handling** - додати обробку помилок
3. **Performance optimization** - кешування та оптимізація
4. **UI Polish** - фінальні правки інтерфейсу
5. **Deployment** - створення installer

**Готовий до тестування інтеграції! 🚀**