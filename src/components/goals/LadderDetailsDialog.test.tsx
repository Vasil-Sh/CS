import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { calculateLadderSteps, type Goal } from "@/hooks/useGoals";
import LadderDetailsDialog from "./LadderDetailsDialog";
afterEach(cleanup);
const goal: Goal = { id:"ladder",name:"Тестова ціль",type:"ladder",status:"active",createdAt:"2026-09-27",startAmount:100,currentBank:100,targetLadderAmount:100000,minOdds:1.3,maxOdds:5,currentStep:0,totalSteps:27,steps:calculateLadderSteps(100,100000,1.3,5) };
describe("Ladder details",()=>{
 it("shows six steps, expands all and closes",()=>{
  const close=vi.fn(); render(<LadderDetailsDialog goal={goal} open onOpenChange={close}/>);
  expect(screen.getAllByRole("row")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button",{name:"Показати всі 27 кроків"}));
  expect(screen.getAllByRole("row")).toHaveLength(28);
  fireEvent.click(screen.getByRole("button",{name:"Згорнути список"}));
  expect(screen.getAllByRole("row")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button",{name:"Закрити"})); expect(close).toHaveBeenCalledWith(false);
 });
 it("keeps a late current step visible and preserves zero actual amounts",()=>{
  const steps=goal.steps!.map((s,i)=>({...s,status:i<20?"completed" as const:i===20?"current" as const:"locked" as const,actualAmount:i===19?0:undefined}));
  render(<LadderDetailsDialog goal={{...goal,steps}} open onOpenChange={()=>{}}/>);
  expect(screen.getByRole("rowheader",{name:"21"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Показати всі 27 кроків"}));
  expect(screen.getByText("Сума: 0 ₴")).toBeInTheDocument();
 });
 it("handles missing steps without inventing data",()=>{
  render(<LadderDetailsDialog goal={{...goal,steps:[]}} open onOpenChange={()=>{}}/>);
  expect(screen.getByText("Кроки прогресії поки відсутні.")).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:/До поточного/})).not.toBeInTheDocument();
 });
});
