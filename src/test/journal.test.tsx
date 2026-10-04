import { describe,it,expect,vi,afterEach } from "vitest";
import { render,screen,fireEvent,cleanup,waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JournalTable from "@/components/mybets/JournalTable";
import { journalProfit,journalAmount,csvCell } from "@/components/mybets/journalModel";
import type { Bet } from "@/types/betting";
const {patch}=vi.hoisted(()=>({patch:vi.fn()}));
vi.mock("@/lib/apiClient",()=>({api:{get:vi.fn().mockResolvedValue([{id:"goal",name:"Моя ціль"}]),patch}}));
vi.mock("@/lib/userDataService",()=>({UserDataService:{getUserData:()=>[]}}));
vi.mock("@/components/mybets/CompactBetModal",()=>({default:()=>null}));
const bet:Bet={id:"1",match:"Falcons vs TYLOO",team1:"Falcons",team2:"TYLOO",betType:"Match Winner",selection:"Falcons",date:"2026-10-03",amount:200,odds:2,result:"Win",profit:200,goalId:"goal"};
const props=()=>({bets:[bet],activeBets:[],currentUser:"test",isAdmin:false,tableFilter:"all" as const,onTableFilterChange:vi.fn(),showAdvancedFilters:false,onToggleAdvancedFilters:vi.fn(),resultFilter:"all" as const,onResultFilterChange:vi.fn(),periodFilter:"all" as const,onPeriodFilterChange:vi.fn(),sortBy:"date" as const,onSortByChange:vi.fn(),sortOrder:"desc" as const,currentPage:1,onPageChange:vi.fn(),searchText:"",onSearchTextChange:vi.fn(),onShareBet:vi.fn(),onBetDetails:vi.fn(),onExpressDetails:vi.fn(),onUpdateResult:vi.fn(),onDeleteBet:vi.fn(),onNavigateToAdd:vi.fn(),onNotesSaved:vi.fn()});
afterEach(()=>{cleanup();patch.mockReset();});
describe("journal money and export",()=>{
 it("converts stored UAH profit to original USD once",()=>expect(journalProfit({...bet,currency:"USD",profit:1320,exchangeRate:40,originalProfit:33})).toBe(33));
 it("uses original profit when no exchange rate is available",()=>expect(journalProfit({...bet,currency:"USD",profit:1320,originalProfit:33})).toBe(33));
 it("does not label UAH as dollars if data is missing",()=>expect(journalProfit({...bet,currency:"USD"})).toBeNull());
 it("converts USD stake from base amount",()=>expect(journalAmount({...bet,currency:"USD",amount:4000,exchangeRate:40})).toBe(100));
 it("preserves zero original amount",()=>expect(journalAmount({...bet,originalAmount:0})).toBe(0));
 it("never shows realized profit for pending records",()=>expect(journalProfit({...bet,result:"Pending"})).toBeNull());
 it("escapes formula injection and quotes in CSV",()=>{expect(csvCell("=CMD()")).toBe('"\'=CMD()"');expect(csvCell('a"b')).toBe('"a""b"');});
});
describe("Journal workspace",()=>{
 it("shows every field and opens a detail panel",async()=>{render(<MemoryRouter><JournalTable {...props()}/></MemoryRouter>);for(const text of ["Дата","Матч","Ваш вибір","Сума","Коеф.","Профіт","Ціль","Статус","Нотатки"])expect(screen.getByRole("columnheader",{name:new RegExp(text.replace(".","\\."))})).toBeVisible();fireEvent.click(screen.getByRole("button",{name:"Деталі: Falcons vs TYLOO"}));expect(screen.getByRole("heading",{name:"Деталі запису"})).toBeVisible();await screen.findAllByText("Моя ціль");fireEvent.click(screen.getByRole("button",{name:"Закрити деталі"}));expect(screen.queryByRole("heading",{name:"Деталі запису"})).not.toBeInTheDocument();});
 it("preserves note on save failure",async()=>{patch.mockRejectedValueOnce(new Error("offline"));const p=props();render(<MemoryRouter><JournalTable {...p}/></MemoryRouter>);fireEvent.click(screen.getByRole("button",{name:"Деталі: Falcons vs TYLOO"}));fireEvent.change(screen.getByRole("textbox",{name:"Нотатки"}),{target:{value:"Мій висновок"}});fireEvent.click(screen.getByRole("button",{name:"Зберегти нотатку"}));await screen.findByRole("alert");expect(screen.getByRole("textbox",{name:"Нотатки"})).toHaveValue("Мій висновок");expect(p.onNotesSaved).not.toHaveBeenCalled();});
 it("saves only notes to the selected record",async()=>{patch.mockResolvedValueOnce({});const p=props();render(<MemoryRouter><JournalTable {...p}/></MemoryRouter>);fireEvent.click(screen.getByRole("button",{name:"Деталі: Falcons vs TYLOO"}));fireEvent.change(screen.getByRole("textbox",{name:"Нотатки"}),{target:{value:"Перевірити склад"}});fireEvent.click(screen.getByRole("button",{name:"Зберегти нотатку"}));await waitFor(()=>expect(p.onNotesSaved).toHaveBeenCalledWith(bet,"Перевірити склад"));expect(patch).toHaveBeenCalledWith("/bets/1",{notes:"Перевірити склад"});});
 it("offers resolution only for pending records",()=>{const p=props();p.bets=[{...bet,result:"Pending"}];render(<MemoryRouter><JournalTable {...p}/></MemoryRouter>);fireEvent.click(screen.getByRole("button",{name:"Деталі: Falcons vs TYLOO"}));fireEvent.click(screen.getByRole("button",{name:"Позначити виграш"}));expect(p.onUpdateResult).toHaveBeenCalledWith(p.bets[0],"Win");});
 it("shows a useful empty search state",()=>{render(<MemoryRouter><JournalTable {...props()} searchText="not-found"/></MemoryRouter>);expect(screen.getByText("Нічого не знайдено")).toBeVisible();expect(screen.getByRole("button",{name:"Скинути фільтри"})).toBeVisible();});
});
