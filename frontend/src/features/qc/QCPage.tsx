import { QCHeader } from "./components/QCHeader";
import { QCKPIs } from "./components/QCKPIs";
import { QCFilter } from "./components/QCFilter";
import { QCTable } from "./components/QCTable";
import { QCDetailsDrawer } from "./components/QCDetailsDrawer";


export default function QCPage() {
  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden relative">
      <QCHeader />
      <QCKPIs />
      <QCFilter />
      <QCTable />
      
      <QCDetailsDrawer />

    </div>
  );
}
