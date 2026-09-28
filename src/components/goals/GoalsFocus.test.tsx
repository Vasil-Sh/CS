import {render,screen,fireEvent,cleanup,within} from "@testing-library/react";
import {afterEach,describe,it,expect,vi} from "vitest";
import GoalsFocus from "./GoalsFocus";
import type {Goal,useGoals} from "@/hooks/useGoals";
afterEach(cleanup);
const goals:Goal[]=[{id:"a",name:"Накопичити",type:"amount",status:"active",isPrimary:true,currentAmount:6400,targetAmount:10000,createdAt:"2026-09-01"},{id:"b",name:"Стабільний ROI",type:"roi",status:"active",currentROI:8,targetROI:12,createdAt:"2026-09-01"}];
function controller(data=goals){return {goals:data,activeGoals:data,completedGoals:[],activeTab:"active",setShowCreateDialog:vi.fn(),setActiveTab:vi.fn(),handleManualUpdate:vi.fn(),isUpdating:false} as unknown as ReturnType<typeof useGoals>;}
describe("Goals master detail",()=>{
it("searches legacy numeric names without crashing",()=>{
render(<GoalsFocus h={controller([{...goals[0],name:123 as unknown as string}])}/>);
fireEvent.change(screen.getByRole("textbox",{name:"Пошук цілі"}),{target:{value:"123"}});
expect(screen.getByRole("button",{name:/123/})).toBeInTheDocument();
});
it("shows progress source in details and switches on selection",()=>{
render(<GoalsFocus h={controller()}/>);
const panel=screen.getByRole("region",{name:"Деталі цілі"});
expect(within(panel).getByRole("heading",{name:"Джерело прогресу"})).toBeInTheDocument();
fireEvent.click(screen.getByRole("button",{name:/Стабільний ROI/}));
expect(within(panel).getByRole("heading",{name:"Стабільний ROI"})).toBeInTheDocument();
});
it("selects the primary goal and switches details by selecting a row",()=>{render(<GoalsFocus h={controller()}/>);const panel=screen.getByRole("region",{name:"Деталі цілі"});expect(within(panel).getByRole("heading",{name:/Накопичити/})).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:/Стабільний ROI/}));expect(within(panel).getByRole("heading",{name:"Стабільний ROI"})).toBeInTheDocument();expect(within(panel).queryByRole("progressbar")).not.toBeInTheDocument();});
it("searches and clears stale details for no matches",()=>{render(<GoalsFocus h={controller()}/>);fireEvent.change(screen.getByRole("textbox",{name:"Пошук цілі"}),{target:{value:"немає"}});expect(screen.getByText("Нічого не знайдено")).toBeInTheDocument();expect(screen.queryByRole("button",{name:"Дії вибраної цілі"})).not.toBeInTheDocument();fireEvent.change(screen.getByRole("textbox",{name:"Пошук цілі"}),{target:{value:"ROI"}});expect(screen.getByRole("button",{name:/Стабільний ROI/})).toHaveAttribute("aria-pressed","true");});
it("renders empty state and retains creation",()=>{const h=controller([]);render(<GoalsFocus h={h}/>);expect(screen.getByText("Немає активних цілей")).toBeInTheDocument();fireEvent.click(within(screen.getByRole("region",{name:"Мої цілі"})).getByRole("button",{name:"Створити ціль"}));expect(h.setShowCreateDialog).toHaveBeenCalledWith(true);});
it("uses the existing progress handler",()=>{const h=controller();render(<GoalsFocus h={h}/>);fireEvent.click(screen.getByRole("button",{name:"Оновити прогрес"}));expect(h.handleManualUpdate).toHaveBeenCalledOnce();});
});
