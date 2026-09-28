import React, { useState } from 'react';
import {
  Building2,
  Palette,
  Check,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Linkedin,
  Facebook,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

// Official X brand icon (Item 5)
const XBrandIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className = 'w-3.5 h-3.5', ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface HubSettingsViewProps {
  onShowToast: (message: string) => void;
}

// Helpers for CPF/CNPJ formatting
const formatCpfCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

// Helper for phone formatting: (00) 00000-0000 or (00) 0000-0000
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

// Helper for CEP formatting: 00000-000
const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

export const HubSettingsView: React.FC<HubSettingsViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'company' | 'palette'>('company');

  // Company Data state
  const [companyData, setCompanyData] = useState({
    logo: '',
    companyName: 'Rafluo Soluções para Eventos Ltda.',
    cpfCnpj: '45.892.104/0001-38',
    phone: '(11) 98765-4321',
    email: 'contato@rafluo.com.br',
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Andar 14',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    // Redes Sociais
    instagram: '@rafluo.eventos',
    twitter: '@rafluo',
    linkedin: 'https://linkedin.com/company/rafluo',
    facebook: 'https://facebook.com/rafluo.oficial',
    whatsapp: '(11) 98765-4321',
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Paleta Institucional editável
  const DEFAULT_PALETTE = {
    primary: '#24152F',
    background: '#FAF6EE',
    accent: '#DFFF5F',
    secondary: '#D25B34',
  };

  const [paletteColors, setPaletteColors] = useState(() => {
    try {
      const saved = localStorage.getItem('rafluo_institutional_palette');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_PALETTE;
  });

  // Handle CEP auto-fill via ViaCEP
  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCep(rawVal);
    setCompanyData((prev) => ({ ...prev, cep: formatted }));

    const clean = rawVal.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCompanyData((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
            complemento: data.complemento || prev.complemento,
          }));
          onShowToast('Endereço preenchido automaticamente pelo CEP!');
        }
      } catch (err) {
        console.error('Erro ao consultar CEP:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyData((prev) => ({ ...prev, logo: reader.result as string }));
        onShowToast('Logo carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Dados da empresa atualizados com sucesso!');
  };

  const handleSavePalette = () => {
    try {
      localStorage.setItem('rafluo_institutional_palette', JSON.stringify(paletteColors));
    } catch {
      // fallback
    }
    onShowToast('Paleta salva com sucesso!');
  };

  const handleResetPalette = () => {
    setPaletteColors(DEFAULT_PALETTE);
    onShowToast('Paleta restaurada para os padrões oficiais.');
  };

  return (
    <div id="hub-settings-view" className="space-y-6 pb-12">
      {/* 1. Page Title H1 + Contextual description */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
          Dados da empresa e diretrizes da paleta institucional.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-[#24152F]/10 dark:border-[#3F2553] pb-2 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-2xs'
              : 'text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Empresa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('palette')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'palette'
              ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-2xs'
              : 'text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Paleta Institucional</span>
        </button>
      </div>

      {/* TAB 1: DADOS DA EMPRESA (Item 5) */}
      {activeTab === 'company' && (
        <div className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#24152F]/10 dark:border-[#3F2553]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Dados da Empresa
              </h2>
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/70">
                Informações cadastrais, endereço e canais de comunicação da empresa.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 dark:bg-[#2E1B3C] text-[#24152F] dark:text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-6 text-xs text-[#24152F] dark:text-[#F7F1E5]">
            {/* Logo Section */}
            <div className="p-4 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#120919] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                {companyData.logo ? (
                  <img
                    src={companyData.logo}
                    alt="Logo da Empresa"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#24152F]/30 dark:text-[#D2C4DC]/30" />
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <span className="font-bold text-xs block">Logo da Empresa</span>
                <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  PNG ou JPG com fundo transparente para relatórios, cabeçalhos e comunicações.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#24152F] border border-[#24152F]/20 dark:border-[#3F2553] hover:bg-[#FAF6EE] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                    <span>Upload da Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {companyData.logo && (
                    <button
                      type="button"
                      onClick={() => setCompanyData((prev) => ({ ...prev, logo: '' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Principais (Lado a lado: Nome/Razão Social | CPF/CNPJ e Celular | E-mail) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome / Razão Social */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nome / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.companyName}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, companyName: e.target.value })
                  }
                  placeholder="Nome fantasia ou razão social da empresa"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                />
              </div>

              {/* CPF / CNPJ */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  CPF / CNPJ *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.cpfCnpj}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      cpfCnpj: formatCpfCnpj(e.target.value),
                    })
                  }
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                />
                <span className="text-[10px] text-[#24152F]/50 dark:text-[#D2C4DC]/50 mt-1 block">
                  Formatação automática para CPF ou CNPJ.
                </span>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Celular *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyData.phone}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        phone: formatPhone(e.target.value),
                      })
                    }
                    placeholder="(00) 00000-0000"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                  <Phone className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/50 absolute left-3 top-3" />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={companyData.email}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, email: e.target.value })
                    }
                    placeholder="contato@empresa.com.br"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                  <Mail className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/50 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553] space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
                <h3 className="font-bold text-xs sm:text-sm text-[#24152F] dark:text-[#F7F1E5]">
                  Endereço
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CEP */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={companyData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                    />
                    {isLoadingCep && (
                      <Loader2 className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F] animate-spin absolute right-3 top-2.5" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#24152F]/50 dark:text-[#D2C4DC]/50 mt-1 block">
                    Busca automática ao preencher.
                  </span>
                </div>

                {/* Logradouro */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">
                    Logradouro *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyData.logradouro}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, logradouro: e.target.value })
                    }
                    placeholder="Rua, Avenida, Praça..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Número */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyData.numero}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, numero: e.target.value })
                    }
                    placeholder="123"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Complemento */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={companyData.complemento}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, complemento: e.target.value })
                    }
                    placeholder="Apto, Sala, Bloco..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Bairro */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyData.bairro}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, bairro: e.target.value })
                    }
                    placeholder="Bairro"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyData.cidade}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, cidade: e.target.value })
                    }
                    placeholder="Cidade"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={companyData.estado}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        estado: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="UF"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] uppercase focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553] space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-[#24152F] dark:text-[#F7F1E5]">
                Redes Sociais
              </h3>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                Informe o @usuário ou link completo dos perfis oficiais da empresa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Instagram */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 text-[#24152F] dark:text-[#F7F1E5]">
                    <Instagram className="w-3.5 h-3.5 text-current" />
                    <span>Instagram</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.instagram}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, instagram: e.target.value })
                    }
                    placeholder="@usuario ou link"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* X (Twitter) */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 text-[#24152F] dark:text-[#F7F1E5]">
                    <XBrandIcon className="w-3.5 h-3.5 text-current" />
                    <span>X (Twitter)</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.twitter}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, twitter: e.target.value })
                    }
                    placeholder="@usuario ou link"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 text-[#24152F] dark:text-[#F7F1E5]">
                    <Linkedin className="w-3.5 h-3.5 text-current" />
                    <span>LinkedIn</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.linkedin}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, linkedin: e.target.value })
                    }
                    placeholder="Link do perfil ou empresa"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 text-[#24152F] dark:text-[#F7F1E5]">
                    <Facebook className="w-3.5 h-3.5 text-current" />
                    <span>Facebook</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.facebook}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, facebook: e.target.value })
                    }
                    placeholder="Link do perfil ou página"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>

                {/* WhatsApp */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 text-[#24152F] dark:text-[#F7F1E5]">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-current" />
                    <span>WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    value={companyData.whatsapp}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, whatsapp: e.target.value })
                    }
                    placeholder="(00) 00000-0000 ou link wa.me/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PALETA INSTITUCIONAL (Itens 3 e 4) */}
      {activeTab === 'palette' && (
        <div className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#24152F]/10 dark:border-[#3F2553]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Paleta Institucional
              </h2>
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/70">
                Altere e customize as cores oficiais aplicadas no sistema, formulários de confirmação e painéis.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 dark:bg-[#2E1B3C] text-[#24152F] dark:text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
              <Palette className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-5">
            {/* Visual Card Preview com as cores editadas em tempo real */}
            <div
              className="p-5 sm:p-6 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] space-y-3 transition-colors"
              style={{ backgroundColor: paletteColors.background }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-xs sm:text-sm"
                  style={{ color: paletteColors.primary }}
                >
                  Pré-visualização da Paleta
                </span>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: paletteColors.accent,
                    color: paletteColors.primary,
                  }}
                >
                  Ativa
                </span>
              </div>

              <p
                className="text-xs"
                style={{ color: `${paletteColors.primary}CC` }}
              >
                Essa paleta será aplicada ao formulário de confirmação de presença e ao painel do responsável pelo evento.
              </p>

              {/* Botão de demonstração com a cor primária e destaque */}
              <div className="pt-2 flex items-center gap-3">
                <div
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
                  style={{
                    backgroundColor: paletteColors.primary,
                    color: paletteColors.background,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: paletteColors.accent }}
                  />
                  Botão Primário
                </div>

                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                  style={{
                    borderColor: `${paletteColors.secondary}60`,
                    color: paletteColors.secondary,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Destaque Secundário
                </div>
              </div>
            </div>

            {/* Inputs de Edição das 4 Cores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Primária */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/50">
                    Primária
                  </span>
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                    style={{ backgroundColor: paletteColors.primary }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={paletteColors.primary}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, primary: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    title="Escolher cor"
                  />
                  <input
                    type="text"
                    value={paletteColors.primary}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, primary: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] uppercase"
                  />
                </div>
              </div>

              {/* 2. Fundo */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/50">
                    Fundo
                  </span>
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                    style={{ backgroundColor: paletteColors.background }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={paletteColors.background}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, background: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    title="Escolher cor"
                  />
                  <input
                    type="text"
                    value={paletteColors.background}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, background: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] uppercase"
                  />
                </div>
              </div>

              {/* 3. Destaque */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/50">
                    Destaque
                  </span>
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                    style={{ backgroundColor: paletteColors.accent }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={paletteColors.accent}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, accent: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    title="Escolher cor"
                  />
                  <input
                    type="text"
                    value={paletteColors.accent}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, accent: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] uppercase"
                  />
                </div>
              </div>

              {/* 4. Secundária */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/50">
                    Secundária
                  </span>
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                    style={{ backgroundColor: paletteColors.secondary }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={paletteColors.secondary}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, secondary: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    title="Escolher cor"
                  />
                  <input
                    type="text"
                    value={paletteColors.secondary}
                    onChange={(e) =>
                      setPaletteColors({ ...paletteColors, secondary: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Ações da Paleta: Restaurar e Salvar (Item 4: nome do botão é "Salvar") */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
              <button
                type="button"
                onClick={handleResetPalette}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] text-xs font-semibold hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={handleSavePalette}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
