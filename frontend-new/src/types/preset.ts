/**
 * Tipos para Presets/Eventos
 * Sincronizados con el backend
 */
import type { LayoutType } from './template';
export interface EventPreset {
  id: string;
  name: string;
  event_type: 'wedding' | 'birthday' | 'party' | 'corporate' | 'public' | 'custom';
  event_date?: string;
  
  // Configuración de captura
  photos_to_take: number;
  countdown_seconds: number;
  auto_reset_seconds: number;
  
  // Audio/Voz
  audio_enabled: boolean;
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
  
  // Template/diseño asociado
  template_id?: string;
  template_name?: string;
  template_layout?: LayoutType;
  template_preview_url?: string | null;
  design_id?: string;
  design_name?: string;
  design_path?: string;
  design_preview_url?: string;
  
  // Metadata
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  
  // Notas del evento
  notes?: string;
  client_name?: string;
  client_contact?: string;
}

export interface PresetsListResponse {
  presets: EventPreset[];
  active_preset?: EventPreset;
  default_preset?: EventPreset;
}

export interface PresetActivateResponse {
  success: boolean;
  preset: EventPreset;
  message: string;
}

export const EVENT_TYPE_LABELS: Record<EventPreset['event_type'], string> = {
  wedding: '💒 Boda',
  birthday: '🎂 Cumpleaños',
  party: '🎉 Fiesta',
  corporate: '🏢 Corporativo',
  public: '🌟 Público',
  custom: '⚙️ Personalizado',
};

export const EVENT_TYPE_COLORS: Record<EventPreset['event_type'], string> = {
  wedding: 'bg-pink-100 text-pink-800 border-pink-300',
  birthday: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  party: 'bg-purple-100 text-purple-800 border-purple-300',
  corporate: 'bg-blue-100 text-blue-800 border-blue-300',
  public: 'bg-green-100 text-green-800 border-green-300',
  custom: 'bg-gray-100 text-gray-800 border-gray-300',
};
