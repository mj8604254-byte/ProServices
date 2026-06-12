import React, { useState } from 'react';
import { ChevronLeft, BarChart3, Download, Calendar, ArrowRight, Table, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface ReportsViewProps {
  orders: any[];
  products: any[];
  onBack: () => void;
}

export function ReportsView({ orders, products, onBack }: ReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<'sales' | 'orders_state' | 'profit' | 'top_products' | 'customer_activity'>('sales');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 1. Calculate Period Filters
  const now = new Date();
  const getPeriodFilteredOrders = () => {
    return orders.filter(o => {
      const orderTime = new Date(o.created_at).getTime();
      if (period === 'day') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return orderTime >= todayStart;
      }
      if (period === 'week') {
        const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return orderTime >= weekStart;
      }
      if (period === 'month') {
        const monthStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        return orderTime >= monthStart;
      }
      if (period === 'year') {
        const yearStart = now.getTime() - 365 * 24 * 60 * 60 * 1000;
        return orderTime >= yearStart;
      }
      if (period === 'custom') {
        const start = customStart ? new Date(customStart).getTime() : 0;
        const end = customEnd ? new Date(customEnd).getTime() : Infinity;
        return orderTime >= start && orderTime <= end;
      }
      return true;
    });
  };

  const filteredOrders = getPeriodFilteredOrders();
  const completed = filteredOrders.filter(o => o.status === 'completed' || o.status === 'Entregue');
  const pending = filteredOrders.filter(o => o.status === 'pending');
  const cancelled = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected');

  // Math metrics
  const totalInvoiced = completed.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const profitMarginEstimate = totalInvoiced * 0.35; // Standard 35% margin for physical sellers

  // Product sold count
  const productSalesMap: { [key: string]: { name: string; qty: number; value: number } } = {};
  completed.forEach(order => {
    (order.items || []).forEach((item: any) => {
      if (!productSalesMap[item.id]) {
        productSalesMap[item.id] = { name: item.name, qty: 0, value: 0 };
      }
      productSalesMap[item.id].qty += Number(item.quantity || 1);
      productSalesMap[item.id].value += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });

  const productPerformances = Object.values(productSalesMap);
  const topSellers = [...productPerformances].sort((a, b) => b.qty - a.qty);
  const bottomSellers = [...productPerformances].sort((a, b) => a.qty - b.qty);

  // Client activities
  const clientMap: { [key: string]: { id: string; count: number; spend: number } } = {};
  filteredOrders.forEach(o => {
    const cid = o.customer_id || 'demo_customer';
    if (!clientMap[cid]) {
      clientMap[cid] = { id: cid, count: 0, spend: 0 };
    }
    clientMap[cid].count += 1;
    if (o.status === 'completed' || o.status === 'Entregue') {
      clientMap[cid].spend += Number(o.total_price || 0);
    }
  });
  const topCustomers = Object.values(clientMap).sort((a, b) => b.spend - a.spend);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileNameStr = 'relatorio';

    if (selectedReport === 'sales') {
      fileNameStr = 'relatorio_vendas';
      headers = ['Data', 'Vendas Concluidas', 'Faturamento Total (MT)'];
      rows = [[
        new Date().toLocaleDateString(),
        completed.length,
        totalInvoiced
      ]];
    } else if (selectedReport === 'orders_state') {
      fileNameStr = 'relatorio_pedidos';
      headers = ['Quantidade Concluidos', 'Quantidade Pendentes', 'Quantidade Cancelados'];
      rows = [[completed.length, pending.length, cancelled.length]];
    } else if (selectedReport === 'profit') {
      fileNameStr = 'relatorio_lucro';
      headers = ['Total Faturado', 'Lucro Estimado (35%)', 'Margem Liquida'];
      rows = [[totalInvoiced, profitMarginEstimate, '35%']];
    } else if (selectedReport === 'top_products') {
      fileNameStr = 'produtos_desempenho';
      headers = ['Produto', 'Quantidade Vendida', 'Total Faturado (MT)'];
      rows = topSellers.map(p => [p.name, p.qty, p.value]);
    } else {
      fileNameStr = 'compradores_ativos';
      headers = ['Cliente ID', 'Frequencia de Pedidos', 'Valor Gasto (MT)'];
      rows = topCustomers.map(c => [c.id, c.count, c.spend]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileNameStr}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in print:bg-white print:p-8" id="reports-view-pane">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-reports-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Estatísticas de Desempenho</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Central de Relatórios</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="print-pdf-btn"
            onClick={handlePrintPDF}
            className="px-5 py-3 bg-navy text-white hover:bg-navy/90 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            Imprimir / Salvar PDF
          </button>
          <button
            id="report-export-csv-btn"
            onClick={handleExportCSV}
            className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel / CSV
          </button>
        </div>
      </div>

      {/* Grid Filter and selectors */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-6 text-left print:hidden">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Selecione o Relatório</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sales', label: '📊 Vendas Totais' },
              { id: 'orders_state', label: '📦 Estado de Encomendas' },
              { id: 'profit', label: '💰 Lucro Líquido' },
              { id: 'top_products', label: '🔥 Desempenho Artigos' },
              { id: 'customer_activity', label: '👥 Atividade Clientes' },
            ].map(r => (
              <button
                id={`rep-sel-${r.id}`}
                key={r.id}
                onClick={() => setSelectedReport(r.id as any)}
                className={`p-3.5 rounded-xl font-bold text-xs text-left transition-all ${
                  selectedReport === r.id 
                    ? 'bg-navy text-white' 
                    : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Selecione o Período</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 mb-3">
            {[
              { id: 'day', label: 'Diário' },
              { id: 'week', label: 'Semanal' },
              { id: 'month', label: 'Mensal' },
              { id: 'year', label: 'Anual' },
              { id: 'custom', label: 'Personalizado' },
            ].map(p => (
              <button
                id={`rep-per-${p.id}`}
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`flex-1 py-1.5 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  period === p.id 
                    ? 'bg-white text-navy shadow-sm' 
                    : 'text-slate-400 hover:text-navy'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">Data Início</span>
                <input
                  id="custom-start-date"
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">Data Fim</span>
                <input
                  id="custom-end-date"
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render selected detailed report page */}
      <div className="bg-white p-8 sm:p-10 rounded-[36px] border border-slate-150 shadow-soft">
        {/* Core title of PDF header when printed */}
        <div className="text-left border-b border-slate-150 pb-6 mb-8 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange">Relatório Oficial Moz ProServices</span>
            <h3 className="text-xl sm:text-2xl font-black text-navy uppercase tracking-tight mt-1">
              {selectedReport === 'sales' && 'Demonstração de Faturação & Receitas'}
              {selectedReport === 'orders_state' && 'Balanço Geral de Encomendas'}
              {selectedReport === 'profit' && 'Auditoria de Lucro & Produtividade'}
              {selectedReport === 'top_products' && 'Estatísticas de Rendimento por Artigo'}
              {selectedReport === 'customer_activity' && 'Ranking dos Melhores Clientes Compradores'}
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-semibold">
              Período: <span className="text-navy font-bold">{period.toUpperCase()}</span> ({new Date().toLocaleDateString()})
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-navy">Faturação Comercial</span>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Autenticado</p>
          </div>
        </div>

        {/* Dynamic Inner template rendering */}
        <div className="text-left space-y-8">
          {selectedReport === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Total Faturado</span>
                  <span className="text-lg sm:text-2xl font-black text-navy">{totalInvoiced.toLocaleString()} MT</span>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Pedidos Transacionados</span>
                  <span className="text-lg sm:text-2xl font-black text-navy">{completed.length}</span>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Ticket Médio Faturado</span>
                  <span className="text-lg sm:text-2xl font-black text-navy">
                    {completed.length > 0 ? Math.round(totalInvoiced / completed.length).toLocaleString() : 0} MT
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-4">Artigos Adquiridos</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                        <th className="p-4">Número Encomenda</th>
                        <th className="p-4">Nº Artigos</th>
                        <th className="p-4">Método de Cobrança</th>
                        <th className="p-4 text-right">Valor Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {completed.map((o, idx) => (
                        <tr key={idx}>
                          <td className="p-4 font-bold text-navy">#{o.id.slice(0, 10)}</td>
                          <td className="p-4">{o.items?.length || 1} tipos de artigo</td>
                          <td className="p-4 uppercase">{o.payment_method || 'M-Pesa'}</td>
                          <td className="p-4 text-right font-black text-navy">{Number(o.total_price).toLocaleString()} MT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'orders_state' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 bg-green-50 rounded-2xl">
                  <span className="text-[9px] text-green-700 uppercase font-bold block mb-1">Entregue / Concluídos</span>
                  <span className="text-2xl font-black text-green-700">{completed.length}</span>
                </div>
                <div className="p-5 bg-orange/5 rounded-2xl">
                  <span className="text-[9px] text-orange uppercase font-bold block mb-1">Pendentes Envio</span>
                  <span className="text-2xl font-black text-orange">{pending.length}</span>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl">
                  <span className="text-[9px] text-red-700 uppercase font-bold block mb-1">Cancelados / Rejeitados</span>
                  <span className="text-2xl font-black text-red-700">{cancelled.length}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-4">Lista Completa de Encomendas</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                        <th className="p-4">Cod Encomenda</th>
                        <th className="p-4">Data Envio</th>
                        <th className="p-4">Estado Interno</th>
                        <th className="p-4 text-right">Preço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                      {filteredOrders.map((o, idx) => (
                        <tr key={idx}>
                          <td className="p-4 font-bold text-navy">#{o.id.slice(0, 10)}</td>
                          <td className="p-4">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className="uppercase text-[10px] font-black">{o.status}</span>
                          </td>
                          <td className="p-4 text-right font-black text-navy">{Number(o.total_price).toLocaleString()} MT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'profit' && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Faturação Bruta</span>
                  <span className="text-2xl font-black text-navy">{totalInvoiced.toLocaleString()} MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Média Lucro Líquido Estimado</span>
                  <span className="text-2xl font-black text-green-600">~{profitMarginEstimate.toLocaleString()} MT</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-1">(Base de cálculo padrão de 35% de margem no retalho)</span>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'top_products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-black text-green-700 uppercase tracking-widest mb-4">🏆 Mais Vendidos (Em Volume)</h4>
                <div className="space-y-3">
                  {topSellers.slice(0, 5).map((p, i) => (
                    <div key={i} className="p-4 bg-green-50/50 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-bold text-navy">{p.name}</span>
                      <span className="font-black text-navy">{p.qty} unidades ({p.value.toLocaleString()} MT)</span>
                    </div>
                  ))}
                  {topSellers.length === 0 && <p className="text-xs text-slate-400 font-semibold text-center py-4">Sem dados comerciais.</p>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-4">⚠️ Menos Vendidos (Menor Conversão)</h4>
                <div className="space-y-3">
                  {bottomSellers.slice(0, 5).map((p, i) => (
                    <div key={i} className="p-4 bg-red-50/20 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-bold text-navy">{p.name}</span>
                      <span className="font-black text-navy">{p.qty} unidades vendidos</span>
                    </div>
                  ))}
                  {bottomSellers.length === 0 && <p className="text-xs text-slate-400 font-semibold text-center py-4">Sem dados comerciais.</p>}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'customer_activity' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-4">Melhores Compradores do Período</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                        <th className="p-4">ID Cliente</th>
                        <th className="p-4 text-center">Nº Encomendas Efetuadas</th>
                        <th className="p-4 text-right">Volume de Contribuição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {topCustomers.slice(0, 10).map((c, i) => (
                        <tr key={i}>
                          <td className="p-4 font-bold text-navy">Cliente Demo {c.id.slice(0, 10)}</td>
                          <td className="p-4 text-center font-bold text-slate-650">{c.count} transação(ões)</td>
                          <td className="p-4 text-right font-black text-orange">{c.spend.toLocaleString()} MT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
