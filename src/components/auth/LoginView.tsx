import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { RafluoLogo } from '../common/RafluoLogo';
import { AdminUser } from '../../types/user';
import { checkTemporaryUserAccess } from '../../utils/dateUtils';

interface LoginViewProps {
  onLogin: (user: AdminUser) => void;
  defaultUser: AdminUser;
  registeredUsers?: AdminUser[];
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  defaultUser,
  registeredUsers = [],
}) => {
  const [email, setEmail] = useState(defaultUser.email);
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    // Find user in registered list or fallback to defaultUser
    const targetUser =
      registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail) ||
      (defaultUser.email.toLowerCase() === cleanEmail ? defaultUser : null);

    if (!targetUser) {
      setError('E-mail não encontrado entre os administradores autorizados.');
      return;
    }

    // Section 19: Check if disabled
    if (targetUser.status === 'disabled') {
      setError('Acesso bloqueado: Este usuário administrativo está desativado no sistema.');
      return;
    }

    // Section 18: Check if temporary
    if (targetUser.status === 'temporary') {
      const access = checkTemporaryUserAccess(targetUser.accessStart, targetUser.accessEnd);
      if (!access.active) {
        setError(
          `Acesso bloqueado: Usuário com permissão temporária fora do período permitido (${access.periodText || 'não configurado'}).`
        );
        return;
      }
    }

    // Success
    onLogin(targetUser);
  };

  return (
    <div
      id="login-view"
      className="min-h-screen bg-[#FAF6EE] flex flex-col justify-between items-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md pt-8 sm:pt-16 pb-6">
        {/* Brand Logo & Descriptor */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-3">
            <RafluoLogo variant="light" size="lg" showDescriptor={false} />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#24152F]/70 tracking-wide mt-1">
            Gestão inteligente de confirmações.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl border border-[#24152F]/15 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F]">
              Acesso ao Rafluo
            </h1>
            <p className="text-xs sm:text-sm text-[#24152F]/60">
              Faça login para gerenciar seus eventos
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#24152F] mb-1">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="usuario@beaquos.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 bg-white text-[#24152F] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                />
                <Mail className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24152F] mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 bg-white text-[#24152F] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                />
                <Lock className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer group border border-[#3F2553]"
            >
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4 text-[#DFFF5F] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Quick profile info / Rodapé */}
          <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#24152F]/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center font-bold text-xs flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[#24152F]/75 leading-relaxed">
              Ambiente seguro para gestores e administradores do Rafluo
            </div>
          </div>
        </div>
      </div>

      {/* Footer Origin */}
      <footer className="py-4 text-center">
        <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC] font-medium">
          Desenvolvido com carinho por{' '}
          <strong className="text-[#24152F] dark:text-[#D2C4DC] font-semibold">Beaquos Estúdio Criativo</strong>
        </p>
      </footer>
    </div>
  );
};
