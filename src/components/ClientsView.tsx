import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Car,
  Calendar,
  Eye,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { Client, Vehicle, Appointment } from '../types/index.ts';
import { formatPlate, formatPhone } from '../utils/formatters.ts';

interface ClientsViewProps {
  clients: Client[];
  appointments: Appointment[];
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
  onViewClientDetails: (client: Client) => void;
  onAddVehicle: (client: Client) => void;
  onNewAppointmentForClient: (client: Client, vehicleId?: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  appointments,
  onNewClient,
  onEditClient,
  onViewClientDetails,
  onAddVehicle,
  onNewAppointmentForClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();

    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchPlate = c.vehicles?.some((v) =>
        v.plate.toLowerCase().includes(q.replace(/[^A-Za-z0-9]/g, ''))
      );
      const matchModel = c.vehicles?.some((v) => v.model.toLowerCase().includes(q));

      return matchName || matchPhone || matchPlate || matchModel;
    });
  }, [clients, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por nome do cliente, telefone ou placa do carro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500"
          />
        </div>

        <button
          onClick={onNewClient}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          + Cadastrar Cliente
        </button>
      </div>

      {/* Clients Table / Cards */}
      <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span>Base de Clientes ({filteredClients.length})</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            Gerenciamento de contatos e frotas particulares
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#101928]/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Nome do Cliente</th>
                <th className="py-3 px-4">Telefone / Contato</th>
                <th className="py-3 px-4">Veículo(s) Cadastrado(s)</th>
                <th className="py-3 px-4">Último Serviço</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    {clients.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#182C45] dark:text-blue-400 flex items-center justify-center mx-auto">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Nenhum cliente cadastrado ainda
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            A base de dados foi limpa para a sua versão final de produção. Cadastre o seu primeiro cliente e veículo para começar!
                          </p>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={onNewClient}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Cadastrar Primeiro Cliente
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        Nenhum cliente encontrado para &ldquo;{searchQuery}&rdquo;.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  // Find last appointment for this client
                  const clientApts = appointments
                    .filter((a) => a.client_id === client.id)
                    .sort(
                      (a, b) =>
                        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
                    );
                  const lastApt = clientApts[0];

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#1A273D]/60 transition-colors group cursor-pointer"
                      onClick={() => onViewClientDetails(client)}
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#18263D] text-[#182C45] dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/60">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{client.name}</div>
                            {client.email && (
                              <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                                {client.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {client.phone ? (
                          <div className="flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {formatPhone(client.phone)}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Vehicles */}
                      <td className="py-3.5 px-4">
                        {!client.vehicles || client.vehicles.length === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddVehicle(client);
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            + Adicionar carro
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {client.vehicles.map((v) => (
                              <span
                                key={v.id}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded"
                              >
                                <span className="font-bold">{formatPlate(v.plate)}</span>
                                <span className="font-sans font-normal text-slate-500 dark:text-slate-400 text-[10px]">
                                  ({v.model.split(' ')[0]})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Last Service */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {lastApt ? (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 block truncate max-w-[200px]">
                              {lastApt.service_name}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {lastApt.scheduled_at.split('T')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">Nenhum serviço anterior</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewAppointmentForClient(client);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-800/60 transition-colors"
                          title="Novo agendamento para este cliente"
                        >
                          + Agendar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddVehicle(client);
                          }}
                          className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Adicionar mais um veículo"
                        >
                          + Carro
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient(client);
                          }}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
