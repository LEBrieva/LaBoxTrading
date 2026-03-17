import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getCalendarData } from "@/lib/actions/stats";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId =
    cookieStore.get("activeAccountId")?.value || accounts[0]?.id;

  if (!activeAccountId) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            Seleccioná una cuenta primero
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const calendarData = await getCalendarData(
    activeAccountId,
    now.getFullYear(),
    now.getMonth()
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase mb-6">
        Calendario
      </h1>
      <CalendarView
        initialData={calendarData}
        accountId={activeAccountId}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
    </div>
  );
}
