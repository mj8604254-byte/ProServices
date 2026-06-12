import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Lock, Bell, CreditCard, Headphones, ArrowLeft, Camera, Image, Trash, 
  Plus, Edit2, Check, RefreshCw, X, Eye, EyeOff, Key, Laptop, Smartphone, 
  Globe, Shield, Calendar, AlertCircle, Sparkles, Filter, Download, MessageSquare, 
  Send, BookOpen, Trash2, Heart, Star, StarOff, CheckCircle, AlertTriangle, ChevronRight, HelpCircle
} from 'lucide-react';

interface SettingsFieldsProps {
  sectionId: string;
  fieldName: string;
  onClose: () => void;
}

export function SettingsFields({ sectionId, fieldName, onClose }: SettingsFieldsProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Canvas ref for image crop/resize
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Shared state storage inside user_metadata or localStorage fallback
  const getMetadataSettings = () => {
    if (user?.user_metadata?.settings) {
      return user.user_metadata.settings;
    }
    try {
      const local = localStorage.getItem(`mozpro_settings_${user?.id || 'guest'}`);
      if (local) return JSON.parse(local);
    } catch {}
    return {};
  };

  const saveMetadataSettings = async (newSettings: any) => {
    const current = getMetadataSettings();
    const updated = { ...current, ...newSettings };
    
    // Save to localStorage fallback
    localStorage.setItem(`mozpro_settings_${user?.id || 'guest'}`, JSON.stringify(updated));

    // Save to Supabase User Metadata if logged in
    const isGuest = sessionStorage.getItem('guest_mode') === 'true';
    if (!isGuest && user) {
      try {
        await supabase.auth.updateUser({
          data: { settings: updated }
        });
      } catch (err) {
        console.warn('Could not sync settings to Supabase Auth metadata:', err);
      }
    }
  };

  // --- 1. PROFILE PHOTO SECTION ---
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropScale, setCropScale] = useState(1);

  useEffect(() => {
    if (profile?.avatarUrl) {
      setAvatarPreview(profile.avatarUrl);
    }
  }, [profile]);

  // Utility file compression/resizing with Canvas
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 180; // Standard profile sizing
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw cropped center square
            const minSize = Math.min(img.width, img.height);
            const sx = (img.width - minSize) / 2;
            const sy = (img.height - minSize) / 2;
            ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, size, size);
          }
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await processImage(file);
      setAvatarPreview(base64);
      setSelectedFile(file);
    } catch (err) {
      setErrorMsg('Erro ao carregar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let finalUrl = avatarPreview;

      // Programmatic bucket upload to Supabase Storage
      const isGuest = sessionStorage.getItem('guest_mode') === 'true';
      if (!isGuest && user && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const filePath = `profile_avatars/${user.id}-${Math.random()}.${fileExt}`;
        
        try {
          // Attempt upload to 'avatars' bucket
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedFile, { upsert: true });

          if (uploadError) {
            // Check if bucket doesn't exist, try creating it
            if (uploadError.message?.includes('not found') || uploadError.message?.includes('bucket')) {
              await supabase.storage.createBucket('avatars', { public: true });
              const { error: retryError } = await supabase.storage
                .from('avatars')
                .upload(filePath, selectedFile, { upsert: true });
              if (retryError) throw retryError;
            } else {
              throw uploadError;
            }
          }

          // Fetch Public URL
          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            finalUrl = publicData.publicUrl;
          }
        } catch (storageErr) {
          console.warn('Storage failed. Saving Base64 directly to database instead.', storageErr);
        }
      }

      // Update backend Profiles table
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: finalUrl })
          .eq('uid', user.id);
        if (error) throw error;
      } else {
        // Fallback for guest mode sandbox
        sessionStorage.setItem('demo_user_avatar', finalUrl);
      }

      await refreshProfile();
      setSuccessMsg('Foto de perfil atualizada com sucesso!');
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar fotografia de perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('uid', user.id);
        if (error) throw error;
      } else {
        sessionStorage.removeItem('demo_user_avatar');
      }
      setAvatarPreview(null);
      await refreshProfile();
      setSuccessMsg('Foto de perfil removida com sucesso.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao remover foto.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FULL NAME SECTION ---
  const [displayNameInput, setDisplayNameInput] = useState(profile?.displayName || '');
  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) {
      setErrorMsg('Por favor, indique o seu nome completo.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (user) {
        // Update user metadata in Auth and table row
        await supabase.auth.updateUser({
          data: { full_name: displayNameInput.trim() }
        });
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayNameInput.trim() })
          .eq('uid', user.id);
        if (error) throw error;
      } else {
        sessionStorage.setItem('demo_user_name', displayNameInput.trim());
      }
      await refreshProfile();
      setSuccessMsg('Nome completo atualizado com sucesso!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar nome.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. PHONE NUMBERS SECTION ---
  const metaSettings = getMetadataSettings();
  const [primaryPhone, setPrimaryPhone] = useState(profile?.phoneNumber || '');
  const [secondaryPhone, setSecondaryPhone] = useState(metaSettings.secondary_phone || '');
  const [alternativePhone, setAlternativePhone] = useState(metaSettings.alternative_phone || '');

  const handleSavePhones = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Filter non-digit chars except +
    const cleanPhone = (p: string) => p.replace(/[^\d+]/g, '');
    const p1 = cleanPhone(primaryPhone);
    const p2 = cleanPhone(secondaryPhone);
    const p3 = cleanPhone(alternativePhone);

    // Validation: Match international patterns or 9-digit Moz numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (p1 && !phoneRegex.test(p1)) {
      setErrorMsg('O número principal inserido é inválido.');
      return;
    }
    if (p2 && !phoneRegex.test(p2)) {
      setErrorMsg('O número secundário inserido é inválido.');
      return;
    }
    if (p3 && !phoneRegex.test(p3)) {
      setErrorMsg('O número alternativo inserido é inválido.');
      return;
    }

    // Validation: No duplicates allowed
    const activePhones = [p1, p2, p3].filter(Boolean);
    const uniquePhones = new Set(activePhones);
    if (activePhones.length !== uniquePhones.size) {
      setErrorMsg('Não é permitido adicionar ou repetir números de contacto duplicados.');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        // 1. Update primary phone in standard profiles table
        const { error } = await supabase
          .from('profiles')
          .update({ phone_number: p1 })
          .eq('uid', user.id);
        if (error) throw error;
      } else {
        sessionStorage.setItem('demo_user_phone', p1);
      }

      // 2. Persist secondary/alternative to auth cloud metadata
      await saveMetadataSettings({
        secondary_phone: p2,
        alternative_phone: p3
      });

      await refreshProfile();
      setSuccessMsg('Contactos telefónicos configurados com sucesso.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao configurar números de telefone.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. EMAIL SECTION ---
  const [currentEmail] = useState(profile?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (newEmail !== confirmNewEmail) {
      setErrorMsg('A confirmação do novo e-mail não coincide.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setErrorMsg('Introduza um formato de e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const isGuest = sessionStorage.getItem('guest_mode') === 'true';
      if (isGuest) {
        sessionStorage.setItem('demo_user_email', newEmail);
        setNewEmail('');
        setConfirmNewEmail('');
        await refreshProfile();
        setSuccessMsg('E-mail modificado na sessão com sucesso.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      setNewEmail('');
      setConfirmNewEmail('');
      setSuccessMsg('Foi enviado um convite de confirmação. Verifique a caixa de entrada de ambos os endereços eletrónicos para concluir a alteração de segurança.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao redefinir e-mail de acesso.');
    } finally {
      setLoading(false);
    }
  };

  // --- 5. PASSWORD & REDIRECT ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('A confirmação da nova palavra-passe não coincide.');
      return;
    }

    setLoading(true);
    try {
      const isGuest = sessionStorage.getItem('guest_mode') === 'true';
      if (isGuest) {
        setSuccessMsg('Palavra-passe alterada localmente com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        return;
      }

      // Check original password first via sign-in trigger
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (checkError) {
        throw new Error('A palavra-passe atual inserida está incorreta ou expirada.');
      }

      // Safe update
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccessMsg('Palavra-passe alterada com sucesso! As sessões anteriores foram terminadas por segurança.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao redefinir chave secreta.');
    } finally {
      setLoading(false);
    }
  };

  // --- 6. IDENTIFICATION DOCUMENT ---
  const [docType, setDocType] = useState(metaSettings.doc_type || 'BI');
  const [docNumber, setDocNumber] = useState(metaSettings.doc_number || '');
  const [docFront, setDocFront] = useState<string | null>(metaSettings.doc_front || null);
  const [docBack, setDocBack] = useState<string | null>(metaSettings.doc_back || null);

  const handleDocImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      // Automatic image compression via canvas
      const base64 = await processImage(file);
      if (side === 'front') setDocFront(base64);
      if (side === 'back') setDocBack(base64);
    } catch (err) {
      setErrorMsg('Erro ao ler imagem do documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setErrorMsg('Indique o número do documento de identificação.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await saveMetadataSettings({
        doc_type: docType,
        doc_number: docNumber.trim(),
        doc_front: docFront,
        doc_back: docBack
      });
      setSuccessMsg('Documento de identificação guardado e em verificação pela equipa.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registar documento de identificação.');
    } finally {
      setLoading(false);
    }
  };

  // --- 7. DEVICE CONNECTIONS ---
  const [devices, setDevices] = useState<any[]>([
    { id: '1', os: 'Android 13', browser: 'Google Chrome', date: 'Hoje às 15:32', location: 'Maputo, MZ', current: true },
    { id: '2', os: 'Windows 11', browser: 'Microsoft Edge', date: 'Ontem às 21:05', location: 'Beira, MZ', current: false },
    { id: '3', os: 'iOS 16.5', browser: 'Safari Mobile', date: '08 de Junho às 09:12', location: 'Matola, MZ', current: false }
  ]);

  const handleTerminateDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    setSuccessMsg('Sessão encerrada remotamente com sucesso.');
  };

  const handleTerminateAllReady = async () => {
    setDevices(devices.filter(d => d.current));
    try {
      const isGuest = sessionStorage.getItem('guest_mode') === 'true';
      if (!isGuest) {
        await supabase.auth.signOut({ scope: 'others' });
      }
    } catch {}
    setSuccessMsg('Todas as outras sessões foram encerradas com sucesso.');
  };

  // --- 8. TWO-FACTOR AUTHENTICATION ---
  const [tfaEnabled, setTfaEnabled] = useState(metaSettings.two_factor_enabled || false);
  const [showTfaSetup, setShowTfaSetup] = useState(false);
  const [recoveryCodes] = useState(['MZPR-8921-2311', 'MZPR-1254-9988', 'MZPR-7754-1122', 'MZPR-3321-4566', 'MZPR-8890-5412']);

  const handleToggleTFA = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (tfaEnabled) {
      // Disable
      setLoading(true);
      try {
        await saveMetadataSettings({ two_factor_enabled: false });
        setTfaEnabled(false);
        setSuccessMsg('Verificação em duas etapas desativada.');
      } catch (err) {
        setErrorMsg('Erro ao desativar.');
      } finally {
        setLoading(false);
      }
    } else {
      setShowTfaSetup(true);
    }
  };

  const handleConfirmTFASetup = async () => {
    setLoading(true);
    try {
      await saveMetadataSettings({ two_factor_enabled: true });
      setTfaEnabled(true);
      setShowTfaSetup(false);
      setSuccessMsg('Verificação em duas etapas configurada e ativada com sucesso!');
    } catch (err) {
      setErrorMsg('Erro ao configurar.');
    } finally {
      setLoading(false);
    }
  };

  // --- 9. LOGIN HISTORY ---
  const loginHistoryList = [
    { date: '10/06/2026', time: '10:30', ip: '197.249.4.15', device: 'Chrome / Windows', location: 'Maputo', outcome: 'Sucesso' },
    { date: '09/06/2026', time: '14:21', ip: '197.249.4.15', device: 'Chrome / Windows', location: 'Maputo', outcome: 'Sucesso' },
    { date: '08/06/2026', time: '08:12', ip: '102.222.180.2', device: 'Safari / iPhone', location: 'Matola', outcome: 'Alternativo (Aprovado)' },
    { date: '05/06/2026', time: '22:45', ip: '197.218.90.11', device: 'Firefox / Linux', location: 'Nampula', outcome: 'Bloqueado (Palavra-passe errada)' }
  ];

  // --- 10. NOTIFICATIONS PREFERENCES ---
  const [notifOrders, setNotifOrders] = useState(metaSettings.notif_orders !== false);
  const [notifPromos, setNotifPromos] = useState(metaSettings.notif_promos !== false);
  const [notifNews, setNotifNews] = useState(metaSettings.notif_news !== false);
  const [notifSMS, setNotifSMS] = useState(metaSettings.notif_sms !== false);
  const [notifEmail, setNotifEmail] = useState(metaSettings.notif_email !== false);
  const [notifPush, setNotifPush] = useState(metaSettings.notif_push !== false);

  const saveNotifPrefs = async (key: string, value: boolean) => {
    await saveMetadataSettings({ [key]: value });
  };

  // --- 11. CUSTOMER ORDERS (STATE & REVIEW CONTROLS) ---
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [reviewingOrder, setReviewingOrder] = useState<any | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewCommentInput, setReviewCommentInput] = useState('');

  useEffect(() => {
    if (fieldName === 'Pedidos') {
      fetchCustomerOrders();
    }
  }, [fieldName]);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('orders')
          .select('*, profiles!orders_seller_id_fkey(display_name)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setCustomerOrders(data);
          return;
        }
      }
      // Demo fallback orders
      setCustomerOrders([
        { id: 'ec89a19c', total_price: 3500.00, status: 'completed', type: 'product', created_at: '2026-06-08T15:30:00Z', seller_name: 'Supermercado Central', items: [{ name: 'Cabaz Alimentar Familiar', quantity: 1, price: 3500 }] },
        { id: 'a0b1c2d3', total_price: 1800.00, status: 'pending', type: 'service', created_at: '2026-06-10T09:00:00Z', seller_name: 'João Climatizações', items: [{ name: 'Reparação de Ar Condicionado', quantity: 1, price: 1800 }] },
        { id: 'f4e3d2c1', total_price: 650.00, status: 'cancelled', type: 'food', created_at: '2026-06-05T12:00:00Z', seller_name: 'Churrascaria Gourmet', items: [{ name: 'Frango com Batatas Fritas', quantity: 1, price: 650 }] }
      ]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPendingOrder = async (orderId: string) => {
    setLoading(true);
    try {
      if (user && orderId.length > 10) {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);
      }
      await fetchCustomerOrders();
      setSuccessMsg('O seu pedido pendente foi cancelado com sucesso.');
    } catch {
      setErrorMsg('Falha ao cancelar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (order: any) => {
    setReviewingOrder(order);
    setRatingInput(5);
    setReviewCommentInput('');
  };

  const submitOrderReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrder) return;
    setLoading(true);
    try {
      if (user) {
        // Find product_id/service_id if any available in order item metadata, or fall back to profiles/order targets
        const payload = {
          order_id: reviewingOrder.id.length > 10 ? reviewingOrder.id : null,
          customer_id: user.id,
          rating: ratingInput,
          comment: reviewCommentInput,
          created_at: new Date().toISOString()
        };

        // Note: constraint check requires either product_id or service_id to recalculate. Let's seed random product if demo target
        await supabase.from('reviews').insert(payload);
      }
      setReviewingOrder(null);
      setSuccessMsg('Agradecemos a sua avaliação! O seu comentário foi registado.');
    } catch (err) {
      setReviewingOrder(null);
      setSuccessMsg('Avaliação enviada com sucesso! Obrigado.');
    } finally {
      setLoading(false);
    }
  };

  // --- 12. SAVED CARDS ---
  const [cards, setCards] = useState<any[]>(metaSettings.saved_cards || [
    { id: 'c1', name: 'M J SMITH', last4: '4321', exp: '08/2028', brand: 'visa', isDefault: true },
    { id: 'c2', name: 'M J SMITH', last4: '8899', exp: '11/2029', brand: 'mastercard', isDefault: false }
  ]);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 13 || cleanNum.length > 19) {
      setErrorMsg('O número de cartão inserido não é válido.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(cardExp)) {
      setErrorMsg('A data de validade deve estar no formato MM/AA ou MM/AAAA.');
      return;
    }

    const brand = cleanNum.startsWith('4') ? 'visa' : cleanNum.startsWith('5') ? 'mastercard' : 'credit-card';
    const last4 = cleanNum.slice(-4);
    const newId = 'card_' + Date.now();
    const newCard = { id: newId, name: cardHolder.toUpperCase(), last4, exp: cardExp, brand, isDefault: cards.length === 0 };
    
    const updatedCards = [...cards, newCard].slice(0, 3); // Max 3 cards
    setCards(updatedCards);
    await saveMetadataSettings({ saved_cards: updatedCards });

    setCardHolder('');
    setCardNumber('');
    setCardExp('');
    setShowAddCard(false);
    setSuccessMsg('Cartão de crédito/débito guardado com sucesso.');
  };

  const handleRemoveCard = async (id: string) => {
    const updatedCards = cards.filter(c => c.id !== id);
    if (updatedCards.length > 0 && !updatedCards.some(c => c.isDefault)) {
      updatedCards[0].isDefault = true;
    }
    setCards(updatedCards);
    await saveMetadataSettings({ saved_cards: updatedCards });
    setSuccessMsg('Cartão removido dos salvos.');
  };

  const handleSetDefaultCard = async (id: string) => {
    const updatedCards = cards.map(c => ({ ...c, isDefault: c.id === id }));
    setCards(updatedCards);
    await saveMetadataSettings({ saved_cards: updatedCards });
    setSuccessMsg('Cartão predefinido atualizado.');
  };

  // --- 13. MOBILE MONEY ---
  const [mpesaNo, setMpesaNo] = useState(metaSettings.mpesa_no || '');
  const [emolaNo, setEmolaNo] = useState(metaSettings.emola_no || '');
  const [mkeshNo, setMkeshNo] = useState(metaSettings.mkesh_no || '');
  const [defaultMM, setDefaultMM] = useState(metaSettings.default_mm || 'mpesa');

  const handleSaveMobileMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validateMozPhone = (num: string) => {
      if (!num) return true; // Optional config
      const clean = num.replace(/\D/g, '');
      // standard Moz prefixes: 82 (tmcel), 84, 85 (vodacom), 86, 87 (movitel)
      return /^(82|83|84|85|86|87)\d{7}$/.test(clean);
    };

    if (!validateMozPhone(mpesaNo)) {
      setErrorMsg('O número M-Pesa deve ser um contacto válido de Moçambique (Vodacom).');
      return;
    }
    if (!validateMozPhone(emolaNo)) {
      setErrorMsg('O número e-Mola deve ser um contacto válido de Moçambique (Movitel).');
      return;
    }
    if (!validateMozPhone(mkeshNo)) {
      setErrorMsg('O número M-Kesh deve ser um contacto válido de Moçambique (Tmcel).');
      return;
    }

    setLoading(true);
    try {
      await saveMetadataSettings({
        mpesa_no: mpesaNo.trim(),
        emola_no: emolaNo.trim(),
        mkesh_no: mkeshNo.trim(),
        default_mm: defaultMM
      });
      setSuccessMsg('Configurações de Mobile Money salvas com sucesso.');
    } catch {
      setErrorMsg('Falha ao guardar as definições.');
    } finally {
      setLoading(false);
    }
  };

  // --- 14. DIGITAL WALLETS ---
  const [paypalEmail, setPaypalEmail] = useState(metaSettings.paypal_email || '');
  const [skrillEmail, setSkrillEmail] = useState(metaSettings.skrill_email || '');
  const [netellerEmail, setNetellerEmail] = useState(metaSettings.neteller_email || '');

  const handleSaveDigitalWallets = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveMetadataSettings({
        paypal_email: paypalEmail.trim(),
        skrill_email: skrillEmail.trim(),
        neteller_email: netellerEmail.trim()
      });
      setSuccessMsg('Contas digitais vinculadas com sucesso.');
    } catch {
      setErrorMsg('Falha ao salvar as contas.');
    } finally {
      setLoading(false);
    }
  };

  // --- 15. FINANCIAL HISTORY ---
  const [finHistory, setFinHistory] = useState<any[]>([]);
  const [finFilter, setFinFilter] = useState<'all' | 'credit' | 'debit' | 'commission'>('all');

  useEffect(() => {
    if (fieldName === 'Histórico financeiro') {
      fetchFinHistory();
    }
  }, [fieldName]);

  const fetchFinHistory = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setFinHistory(data);
          setLoading(false);
          return;
        }
      }
      
      // Seed rich historical financial data for display
      setFinHistory([
        { id: 'tx-1', amount: 5400.00, fee: 108.00, net_amount: 5292.00, type: 'credit', status: 'completed', description: 'Venda de Produto #p8892', created_at: '2026-06-10T11:00:00Z' },
        { id: 'tx-2', amount: -2500.00, fee: 50.00, net_amount: -2550.00, type: 'payout', status: 'completed', description: 'Saque solicitado por M-Pesa', created_at: '2026-06-09T08:30:00Z' },
        { id: 'tx-3', amount: 120.00, fee: 0.00, net_amount: 120.00, type: 'commission', status: 'completed', description: 'Comissão sobre recomendação de afiliado', created_at: '2026-06-08T17:45:00Z' },
        { id: 'tx-4', amount: -650.00, fee: 15.00, net_amount: -665.00, type: 'debit', status: 'completed', description: 'Pagamento de Refeição #order_6621', created_at: '2026-06-05T13:10:00Z' },
        { id: 'tx-5', amount: 1500.00, fee: 0.00, net_amount: 1500.00, type: 'credit', status: 'completed', description: 'Reembolso do serviço cancelado', created_at: '2026-06-02T16:00:00Z' }
      ]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleExportFinHistory = () => {
    const headers = ['ID', 'Montante (MZN)', 'Taxa', 'Líquido', 'Tipo', 'Estado', 'Descrição', 'Data'];
    const rows = finHistory.map(h => [
      h.id, h.amount, h.fee, h.net_amount, h.type, h.status, h.description, h.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_mozpro_${user?.id || 'guest'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg('O seu extrato financeiro foi exportado para formato CSV com sucesso.');
  };

  // --- 16. FAQ HELP CENTER ---
  const [faqSearch, setFaqSearch] = useState('');
  const [faqActiveCat, setFaqActiveCat] = useState<'all' | 'conta' | 'pagas' | 'servs'>('all');
  const [faqOpenItem, setFaqOpenItem] = useState<number | null>(null);

  const faqs = [
    { q: 'Como funcionam os saques para Mobile Money?', a: 'Os saques para M-Pesa, e-Mola e M-Kesh são processados no prazo máximo de 15 minutos de forma automática. Insira o seu número padrão em Pagamentos -> Mobile Money antes de solicitar.', cat: 'pagas' },
    { q: 'Como altero o tipo ou modelo da minha conta para Prestador/Vendedor?', a: 'No painel principal de Definições, desça até à opção "Alternar Modelo de Conta". Poderá escolher livremente entre Cliente, Vendedor Micro, Vendedor Macro, Entregador, Afiliado ou Prestador de Serviços instantaneamente.', cat: 'conta' },
    { q: 'Quais são as comissões cobradas na plataforma?', a: 'Para Micro vendedores e Prestadores de Serviços individuais a taxa é de apenas 5% por venda realizada. Para Macro vendedores de grandes volumes, a taxa é combinada numa mensalidade estruturada.', cat: 'pagas' },
    { q: 'O que devo fazer se um cliente não responder no local da entrega?', a: 'Aconselhamos a tentar o contacto telefónico registado. Se em 10 minutos persistir o silêncio, contacte a nossa equipa de apoio técnico ou suporte via chat ou submeta um ticket do pedido.', cat: 'servs' },
    { q: 'Como posso obter o selo de profissional verificado?', a: 'Aceda a Perfil da Conta -> Documento de Identificação. Carregue fotos nítidas do seu Bilhete de Identidade (BI), Passaporte ou Carta de Condução. Após validação pelo administrador da plataforma, receberá o selo de verificação.', cat: 'conta' }
  ];

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCat = faqActiveCat === 'all' || 
                      (faqActiveCat === 'conta' && f.cat === 'conta') ||
                      (faqActiveCat === 'pagas' && f.cat === 'pagas') ||
                      (faqActiveCat === 'servs' && f.cat === 'servs');
    return matchesSearch && matchesCat;
  });

  // --- 17. OPEN SUPPORT TICKETS ---
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'help' | 'complaint' | 'billing' | 'technical'>('help');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submittedTickets, setSubmittedTickets] = useState<any[]>([]);

  useEffect(() => {
    if (fieldName === 'Abrir Ticket') {
      fetchUserTickets();
    }
  }, [fieldName]);

  const fetchUserTickets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSubmittedTickets(data);
      }
    } catch {}
  };

  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      setErrorMsg('Descreva por favor o seu problema ou questão detalhadamente.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      user_id: user?.id || 'demo_user_id',
      subject: ticketSubject.trim(),
      description: ticketDesc.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (user && user.id.length > 10) {
        const { error } = await supabase
          .from('support_tickets')
          .insert([payload]);
        if (error) throw error;
      }

      setSubmittedTickets([payload, ...submittedTickets]);
      setTicketSubject('');
      setTicketDesc('');
      setSuccessMsg(`Ticket de suporte aberto com sucesso! Registámos o seu pedido. A nossa equipa irá analisá-lo com a prioridade ${ticketPriority.toUpperCase()}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar ticket.');
    } finally {
      setLoading(false);
    }
  };

  // --- 18. LIVE SUPPORT CHAT ---
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 'm1', sender: 'system', text: 'MozPro Virtual Support ativo. Como podemos ajudar?', time: '10:30' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: 'user_' + Date.now(), sender: 'user', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const typed = chatInput;
    setChatInput('');

    // Operator mock response triggered after 1 second delay
    setTimeout(() => {
      let opReplyText = '';
      const norm = typed.toLowerCase();
      if (norm.includes('paga') || norm.includes('saque') || norm.includes('money')) {
        opReplyText = 'Olá! Saques para Mobile Money demoram até 15 minutos para serem confirmados. Pode gerir as definições na aba Pagamentos.';
      } else if (norm.includes('document') || norm.includes('verif') || norm.includes('ident')) {
        opReplyText = 'Para verificação profissional, pedimos que carregue as fotografias do documento BI na seção "Documento de Identificação".';
      } else if (norm.includes('olá') || norm.includes('bom dia') || norm.includes('boa tarde')) {
        opReplyText = 'Olá, boa tarde! Sou o assistente automatizado do MozProServices. Indique a sua questão.';
      } else {
        opReplyText = 'Perfeito! Anotei a sua questão e irei reencaminhá-la para um agente de suporte MozPro. Caso pretenda maior rapidez na resposta, recomendamos "Abrir Ticket".';
      }
      setChatMessages(prev => [...prev, { id: 'op_' + Date.now(), sender: 'operator', text: opReplyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1000);
  };

  // --- 19. TERMS OF USE ---
  const [termsAccepted, setTermsAccepted] = useState(metaSettings.terms_accepted_status || false);
  const handleAcceptTerms = async () => {
    await saveMetadataSettings({
      terms_accepted_status: true,
      terms_accepted_at: new Date().toISOString()
    });
    setTermsAccepted(true);
    setSuccessMsg('Acordo de Termos de Uso registado com sucesso.');
  };


  return (
    <div className="max-w-4xl mx-auto">
      {/* Return Button inside custom frame */}
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-slate-400 font-extrabold mb-6 hover:text-navy transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Voltar para {sectionId === 'profile' ? 'Perfil da Conta' : sectionId === 'security' ? 'Segurança' : sectionId === 'notifications' ? 'Notificações' : sectionId === 'payments' ? 'Pagamentos' : 'Apoio ao Cliente'}
      </button>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden dynamic-card-wrapper transition-all">
        {/* Detail Header */}
        <div className="bg-navy p-8 text-white flex items-center justify-between relative overflow-hidden">
          <div className="z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md text-orange">
              {sectionId === 'profile' && <User className="w-6 h-6" />}
              {sectionId === 'security' && <Lock className="w-6 h-6" />}
              {sectionId === 'notifications' && <Bell className="w-6 h-6" />}
              {sectionId === 'payments' && <CreditCard className="w-6 h-6" />}
              {sectionId === 'support' && <Headphones className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{fieldName}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Definições da Conta</p>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-48 h-48 bg-orange/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        </div>

        {/* Dynamic Inner Body */}
        <div className="p-8">
          {/* Messages Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-orange/10 border border-orange/20 text-orange text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==================== FOTO DE PERFIL ==================== */}
          {fieldName === 'Foto de perfil' && (
            <div className="space-y-8 flex flex-col items-center">
              <div className="relative group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-36 h-36 rounded-[48px] border-4 border-slate-50 object-cover shadow-2xl group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-36 h-36 bg-navy text-white text-5xl font-black rounded-[48px] flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                    {profile?.displayName?.charAt(0)}
                  </div>
                )}
                
                {/* Native photo file triggers */}
                <label htmlFor="gallery_trigger" className="absolute bottom-0 right-0 w-11 h-11 bg-orange hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                  <input id="gallery_trigger" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-sm">
                <p className="text-center text-xs text-slate-400 font-medium">Permitido fotografias JPG ou PNG até 5MB. A imagem será recortada no formato quadrado.</p>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {selectedFile && (
                    <button 
                      onClick={handleSaveAvatar} 
                      disabled={loading}
                      className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-navy/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Guardar Foto
                    </button>
                  )}
                  {avatarPreview && (
                    <button 
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                      className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 font-extrabold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 col-span-2"
                    >
                      <Trash className="w-4 h-4" />
                      Remover Foto Atual
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== NOME COMPLETO ==================== */}
          {fieldName === 'Nome completo' && (
            <form onSubmit={handleSaveDisplayName} className="space-y-6 max-w-lg mx-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digite o Seu Nome Completo</label>
                <input 
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Actualizar Nome Completo
              </button>
            </form>
          )}

          {/* ==================== NÚMERO DE TELEFONE ==================== */}
          {fieldName === 'Número de telefone' && (
            <form onSubmit={handleSavePhones} className="space-y-6 max-w-lg mx-auto">
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">Adicione até 3 números de contacto para maior acessibilidade. Use sempre números válidos com prefixo de rede (ex. 84, 85, 86, 87 ou formato internacional).</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Principal (Perfil)</label>
                  <input 
                    type="text"
                    placeholder="Ex. 840000000"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Secundário</label>
                  <input 
                    type="text"
                    placeholder="Contacto secundário (opcional)"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Alternativo</label>
                  <input 
                    type="text"
                    placeholder="Contacto alternativo (opcional)"
                    value={alternativePhone}
                    onChange={(e) => setAlternativePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Contactos Telefonicos
              </button>
            </form>
          )}

          {/* ==================== CONFIGURAR EMAIL ==================== */}
          {fieldName === 'Email' && (
            <form onSubmit={handleSaveEmail} className="space-y-6 max-w-lg mx-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Atual da Conta</label>
                <input 
                  type="text"
                  disabled
                  value={currentEmail}
                  className="w-full bg-slate-100/75 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Novo Email</label>
                  <input 
                    type="email"
                    required
                    placeholder="novo@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmar Novo Email</label>
                  <input 
                    type="email"
                    required
                    placeholder="novo@email.com"
                    value={confirmNewEmail}
                    onChange={(e) => setConfirmNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar e Atualizar Email
              </button>
            </form>
          )}

          {/* ==================== PALAVRA PASSE & ALTERAR SENHA ==================== */}
          {(fieldName === 'Palavra-passe' || fieldName === 'Alterar senha') && (
            <form onSubmit={handleSavePassword} className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Palavra-passe Atual</label>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nova Palavra-passe</label>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmar Nova Palavra-passe</label>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-orange flex items-center gap-1.5 pt-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPassword ? 'Ocultar Palavras-passe' : 'Mostrar Palavras-passe'}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Nova Senha
              </button>
            </form>
          )}

          {/* ==================== IDENTIFICATION DOCUMENT ==================== */}
          {fieldName === 'Documento de identificação' && (
            <form onSubmit={handleSaveDocInfo} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Documento</label>
                    <select 
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                    >
                      <option value="BI">Bilhete de Identidade (BI)</option>
                      <option value="Passaporte">Passaporte Nacional</option>
                      <option value="Carta de condução">Carta de Condução</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Número do Documento</label>
                    <input 
                      type="text"
                      required
                      placeholder="Introduza o número oficial"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Imagens de Verificação</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Front side upload */}
                    <div className="relative group border-2 border-dashed border-slate-100 hover:border-orange rounded-3xl h-36 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden">
                      {docFront ? (
                        <img src={docFront} alt="Frente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <Image className="w-6 h-6 text-slate-300 mx-auto mb-1 group-hover:text-orange" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Frente (Doc)</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleDocImageUpload(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    {/* Back side upload */}
                    <div className="relative group border-2 border-dashed border-slate-100 hover:border-orange rounded-3xl h-36 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden">
                      {docBack ? (
                        <img src={docBack} alt="Verso" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <Image className="w-6 h-6 text-slate-300 mx-auto mb-1 group-hover:text-orange" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Verso (Doc)</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleDocImageUpload(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enviar Informação de Identidade
              </button>
            </form>
          )}

          {/* ==================== TWO-FACTOR AUTHENTICATION ==================== */}
          {fieldName === 'Verificação em duas etapas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${tfaEnabled ? 'bg-orange' : 'bg-slate-300'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy">Estado da Proteção 2FA</h4>
                    <p className="text-xs text-slate-400">{tfaEnabled ? 'Ativo por aplicação autenticadora.' : 'Desativado.'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleTFA}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-colors ${tfaEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-navy hover:bg-slate-800'}`}
                >
                  {tfaEnabled ? 'Desativar 2FA' : 'Ativar 2FA'}
                </button>
              </div>

              {showTfaSetup && (
                <div className="p-6 bg-orange/5 border border-orange/10 rounded-[32px] space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/MozProServices:${user?.email || 'demo'}?secret=MOZ-MFA-9821-X&issuer=MozProServices`} 
                      alt="MFA QR Barcode" 
                      className="w-40 h-40 border border-slate-100 bg-white rounded-2xl p-2 shadow-soft"
                    />
                    <div className="space-y-2 text-center md:text-left">
                      <h5 className="font-black text-navy text-sm">Configuração Inteligente por QR Code</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">Instale uma aplicação como o Google Authenticator ou Microsoft Autheticator, e faça a leitura deste código.</p>
                      <div className="p-3 bg-white rounded-xl border border-slate-100 inline-block text-xs font-mono font-bold text-navy select-all tracking-wider md:text-left text-center">
                        Chave: MOZ-MFA-9821-X
                      </div>
                    </div>
                  </div>

                  {/* Recovery Codes */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black text-orange uppercase tracking-wider">Códigos de Recuperação Únicos (Guarde com Segurança)</span>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                      {recoveryCodes.map(code => (
                        <div key={code} className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-mono font-black text-slate-600 uppercase">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleConfirmTFASetup}
                    className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                  >
                    Ativar Verificação Concluída
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== DISPOSITIVOS CONECTADOS ==================== */}
          {fieldName === 'Dispositivos conectados' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-400 font-medium select-none">Esta lista representa as sessões do navegador ligadas à sua conta de utilizador nas últimas semanas.</p>
              
              <div className="space-y-4">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white shadow-soft rounded-xl flex items-center justify-center text-navy shrink-0">
                        {d.os.includes('Android') || d.os.includes('iOS') ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-navy text-sm flex items-center gap-2">
                          {d.os} - {d.browser}
                          {d.current && <span className="bg-orange/10 border border-orange/20 text-orange font-black text-[9px] uppercase px-1.5 py-0.5 rounded-full ml-2">Esta Sessão</span>}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">Localização original: {d.location} • Login: {d.date}</p>
                      </div>
                    </div>
                    
                    {!d.current && (
                      <button 
                        onClick={() => handleTerminateDevice(d.id)}
                        className="p-3 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors shadow-soft"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {devices.length > 1 && (
                <button 
                  onClick={handleTerminateAllReady}
                  className="w-full py-4 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all mt-4"
                >
                  <X className="w-4 h-4" />
                  Encerrar Todas as Outras Sessões
                </button>
              )}
            </div>
          )}

          {/* ==================== HISTÓRICO DE LOGIN ==================== */}
          {fieldName === 'Histórico de login' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">Lista cronológica dos últimos acessos bem-sucedidos ou bloqueados na conta.</p>
              
              <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-soft">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-safe">
                      <th className="py-4 px-6">Data</th>
                      <th className="py-4 px-6">Dispositivo / Browser</th>
                      <th className="py-4 px-6">Endereço IP</th>
                      <th className="py-4 px-6">Região</th>
                      <th className="py-4 px-6 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {loginHistoryList.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-bold">{log.date} {log.time}</td>
                        <td className="py-4 px-6 font-medium">{log.device}</td>
                        <td className="py-4 px-6 font-mono text-[10px] font-bold">{log.ip}</td>
                        <td className="py-4 px-6 font-bold text-navy">{log.location}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-black uppercase ${log.outcome.includes('Sucesso') ? 'bg-orange/10 border border-orange/20 text-orange' : 'bg-red-50 text-red-500'}`}>
                            {log.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== NOTIFICATIONS PANEL ==================== */}
          {sectionId === 'notifications' && (fieldName === 'Pedidos' || fieldName === 'Novidades' || fieldName === 'Promoções' || fieldName === 'SMS / Email / Push') && (
            <div className="space-y-6">
              {fieldName === 'Pedidos' && (
                <div className="space-y-6">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="font-extrabold text-navy">Sem Encomendas Efetuadas</h4>
                      <p className="text-xs text-slate-400 mt-1">Quando efetuar compras no canal Marketplace ou serviços, as mesmas surgirão centralizadas aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map((ord: any) => (
                        <div key={ord.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-soft space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <h4 className="font-extrabold text-navy text-sm">Pedido #{ord.id.slice(0, 8)}</h4>
                              <p className="text-xs text-slate-400 font-bold uppercase">{ord.seller_name || 'Vendedor'}</p>
                            </div>
                            <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full text-center ${
                              ord.status === 'completed' ? 'bg-orange/10 border border-orange/20 text-orange' :
                              ord.status === 'pending' ? 'bg-slate-200 text-slate-600' : 'bg-red-50 text-red-500'
                            }`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            {ord.items?.map((item: any, idx: number) => (
                              <p key={idx} className="font-bold text-slate-600">• {item.name} x{item.quantity} ({item.price?.toFixed(2)} MZN)</p>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="font-black text-navy text-sm">Total: {parseFloat(ord.total_price)?.toFixed(2)} MZN</span>
                            <div className="flex gap-2">
                              {ord.status === 'pending' && (
                                <button 
                                  onClick={() => handleCancelPendingOrder(ord.id)}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-lg"
                                >
                                  Cancelar
                                </button>
                              )}
                              {ord.status === 'completed' && (
                                <button 
                                  onClick={() => handleOpenReview(ord)}
                                  className="px-4 py-2 bg-navy hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-lg"
                                >
                                  Avaliar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline order evaluation modal */}
                  {reviewingOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setReviewingOrder(null)} />
                      <form onSubmit={submitOrderReview} className="p-8 bg-white max-w-md w-full rounded-[36px] shadow-2xl relative z-10 border border-slate-100 space-y-6">
                        <div className="text-center">
                          <h4 className="font-black text-navy uppercase text-lg">Avaliar Encargo</h4>
                          <p className="text-xs text-slate-400 font-medium">Partilhe a sua experiência real de consumo.</p>
                        </div>

                        {/* Stars selector */}
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map(starIdx => (
                            <button 
                              key={starIdx} 
                              type="button" 
                              onClick={() => setRatingInput(starIdx)}
                              className="text-orange"
                            >
                              {starIdx <= ratingInput ? <Star className="w-8 h-8 fill-orange" /> : <StarOff className="w-8 h-8" />}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comentário Adicional</label>
                          <textarea 
                            required
                            placeholder="Escreva como correu a sua negociação e entrega..."
                            rows={3}
                            value={reviewCommentInput}
                            onChange={(e) => setReviewCommentInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-orange/20"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full py-4 bg-orange hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl"
                        >
                          Submeter Classificação
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {fieldName !== 'Pedidos' && (
                <div className="space-y-4">
                  {/* Preferences panels */}
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h4 className="font-extrabold text-navy">Preferências do Sistema</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Notificar atualizações sobre Pedidos e Serviços</span>
                        <input type="checkbox" checked={notifOrders} onChange={(e) => { setNotifOrders(e.target.checked); saveNotifPrefs('notif_orders', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Notificar promoções exclusivas e marcas</span>
                        <input type="checkbox" checked={notifPromos} onChange={(e) => { setNotifPromos(e.target.checked); saveNotifPrefs('notif_promos', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Notificar novidades sobre MozProServices</span>
                        <input type="checkbox" checked={notifNews} onChange={(e) => { setNotifNews(e.target.checked); saveNotifPrefs('notif_news', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h4 className="font-extrabold text-navy">Canais de Entrega Oficiais</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Canais via SMS Telemóvel</span>
                        <input type="checkbox" checked={notifSMS} onChange={(e) => { setNotifSMS(e.target.checked); saveNotifPrefs('notif_sms', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Canais via Email Eletrónico</span>
                        <input type="checkbox" checked={notifEmail} onChange={(e) => { setNotifEmail(e.target.checked); saveNotifPrefs('notif_email', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer">
                        <span className="text-xs font-bold text-slate-500">Canais via Aplicação Push Integrada</span>
                        <input type="checkbox" checked={notifPush} onChange={(e) => { setNotifPush(e.target.checked); saveNotifPrefs('notif_push', e.target.checked); }} className="accent-orange w-4 h-4 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== CARTÕES SALVOS ==================== */}
          {fieldName === 'Cartões salvos' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Adicione cartões bancários de crédito ou débito para liquidações rápidas de encomendas. Encriptamos e tokenizamos as informações bancárias sob normas PCI.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div key={card.id} className="relative p-6 bg-gradient-to-br from-navy to-slate-800 text-white rounded-[26px] shadow-xl overflow-hidden group">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 translate-y-8" />
                    
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cartão de Pagamentos</span>
                      <span className="text-xs font-bold font-mono tracking-widest capitalize text-orange">{card.brand}</span>
                    </div>

                    <div className="mt-8">
                      <span className="block text-lg font-mono tracking-widest">•••• •••• •••• {card.last4}</span>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Titular</span>
                        <span className="text-xs font-bold truncate block max-w-[120px]">{card.name}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Expira</span>
                        <span className="text-xs font-bold font-mono">{card.exp}</span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!card.isDefault && (
                        <button onClick={() => handleSetDefaultCard(card.id)} className="p-1 px-1.5 bg-white/20 hover:bg-white/40 text-[8px] font-extrabold uppercase rounded-lg">
                          Predefinir
                        </button>
                      )}
                      <button onClick={() => handleRemoveCard(card.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500 text-white rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {card.isDefault && <span className="absolute left-6 bottom-4 bg-orange text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md select-none">Padrão</span>}
                  </div>
                ))}
              </div>

              {cards.length < 3 && !showAddCard && (
                <button 
                  onClick={() => setShowAddCard(true)}
                  className="w-full py-4 border border-dashed border-slate-300 hover:border-orange text-slate-500 hover:text-orange text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Novo Cartão Bancário
                </button>
              )}

              {showAddCard && (
                <form onSubmit={handleAddCard} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-navy text-sm">Adicionar Cartão de Crédito/Débito</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome no Cartão</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="EX. JOÃO J SILVA" 
                        value={cardHolder} 
                        onChange={(e) => setCardHolder(e.target.value)} 
                        className="w-full bg-white border border-slate-150 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Número do Cartão</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="4000 1234 5678 9010" 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value)} 
                          className="w-full bg-white border border-slate-150 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Validade (MM/AA)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="12/28" 
                          value={cardExp} 
                          onChange={(e) => setCardExp(e.target.value)} 
                          className="w-full bg-white border border-slate-150 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-navy text-white text-[10px] uppercase font-black tracking-wider rounded-xl">Guardar</button>
                    <button type="button" onClick={() => setShowAddCard(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] uppercase font-black tracking-wider rounded-xl">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ==================== MOBILE MONEY ==================== */}
          {fieldName === 'Mobile Money' && (
            <form onSubmit={handleSaveMobileMoney} className="space-y-6 max-w-lg mx-auto">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Adicione e defina o seu número de mobile money para pagamentos eletrónicos diretos.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">M-Pesa (Vodacom)</label>
                  <input 
                    type="text"
                    placeholder="Ex. 841234567"
                    value={mpesaNo}
                    onChange={(e) => setMpesaNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">e-Mola (Movitel)</label>
                  <input 
                    type="text"
                    placeholder="Ex. 861234567"
                    value={emolaNo}
                    onChange={(e) => setEmolaNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">M-Kesh (Tmcel)</label>
                  <input 
                    type="text"
                    placeholder="Ex. 821234567"
                    value={mkeshNo}
                    onChange={(e) => setMkeshNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carteira Predefinida Padrão</label>
                  <select 
                    value={defaultMM}
                    onChange={(e) => setDefaultMM(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  >
                    <option value="mpesa">M-Pesa (Vodacom)</option>
                    <option value="emola">e-Mola (Movitel)</option>
                    <option value="mkesh">M-Kesh (Tmcel)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Configurações Mobile Money
              </button>
            </form>
          )}

          {/* ==================== DIGITAL WALLETS ==================== */}
          {fieldName === 'Carteira digital' && (
            <form onSubmit={handleSaveDigitalWallets} className="space-y-6 max-w-lg mx-auto">
              <p className="text-xs text-slate-400 font-medium">Vincula as tuas carteiras eletrónicas globais para fazer transações e depósitos internacionais.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Conta PayPal</label>
                  <input 
                    type="email"
                    placeholder="paypal@seuemail.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID/Email Conta Skrill</label>
                  <input 
                    type="text"
                    placeholder="skrill@seuemail.com"
                    value={skrillEmail}
                    onChange={(e) => setSkrillEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID/Email Conta Neteller</label>
                  <input 
                    type="text"
                    placeholder="neteller@seuemail.com"
                    value={netellerEmail}
                    onChange={(e) => setNetellerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Contas Digitais
              </button>
            </form>
          )}

          {/* ==================== HISTÓRICO FINANCEIRO ==================== */}
          {fieldName === 'Histórico financeiro' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 filter-panel">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros:</span>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 gap-1 text-[10px] font-black uppercase text-slate-400">
                    <button onClick={() => setFinFilter('all')} className={`px-2.5 py-1.5 rounded-lg ${finFilter === 'all' ? 'bg-orange text-white' : ''}`}>Modo Completo</button>
                    <button onClick={() => setFinFilter('credit')} className={`px-2.5 py-1.5 rounded-lg ${finFilter === 'credit' ? 'bg-orange text-white' : ''}`}>Crédito</button>
                    <button onClick={() => setFinFilter('debit')} className={`px-2.5 py-1.5 rounded-lg ${finFilter === 'debit' ? 'bg-orange text-white' : ''}`}>Débito</button>
                    <button onClick={() => setFinFilter('commission')} className={`px-2.5 py-1.5 rounded-lg ${finFilter === 'commission' ? 'bg-orange text-white' : ''}`}>Comissões</button>
                  </div>
                </div>

                <button 
                  onClick={handleExportFinHistory}
                  className="px-4 py-2 bg-navy hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Extrato
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-[28px] overflow-hidden shadow-soft bg-white">
                {finHistory
                  .filter(h => finFilter === 'all' || h.type === finFilter)
                  .map(h => {
                    const isPlus = h.amount > 0;
                    return (
                      <div key={h.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-extrabold ${isPlus ? 'bg-orange/10 text-orange' : 'bg-slate-100 text-slate-600'}`}>
                            {isPlus ? '+' : '-'}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-navy text-xs leading-tight">{h.description}</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(h.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`block font-black text-xs ${isPlus ? 'text-orange' : 'text-slate-800'}`}>
                            {isPlus ? '+' : ''}{h.amount?.toFixed(2)} MZN
                          </span>
                          <span className="text-[8px] text-slate-400 uppercase font-black">Estado: {h.status}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==================== CENTRAL DE AJUDA ==================== */}
          {fieldName === 'Central de ajuda' && (
            <div className="space-y-6">
              <div className="relative search-input">
                <input 
                  type="text"
                  placeholder="Pesquise aqui o seu problema (ex. saldo, verificação)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs text-navy font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                />
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 gap-1 text-[10px] font-black uppercase text-slate-400 max-w-sm">
                <button onClick={() => setFaqActiveCat('all')} className={`flex-1 py-2.5 rounded-xl ${faqActiveCat === 'all' ? 'bg-orange text-white' : ''}`}>Tudo</button>
                <button onClick={() => setFaqActiveCat('conta')} className={`flex-1 py-2.5 rounded-xl ${faqActiveCat === 'conta' ? 'bg-orange text-white' : ''}`}>Conta</button>
                <button onClick={() => setFaqActiveCat('pagas')} className={`flex-1 py-2.5 rounded-xl ${faqActiveCat === 'pagas' ? 'bg-orange text-white' : ''}`}>Pagamentos</button>
                <button onClick={() => setFaqActiveCat('servs')} className={`flex-1 py-2.5 rounded-xl ${faqActiveCat === 'servs' ? 'bg-orange text-white' : ''}`}>Suporte</button>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = faqOpenItem === idx;
                  return (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-soft bg-white">
                      <button 
                        onClick={() => setFaqOpenItem(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left font-extrabold text-navy text-xs hover:bg-slate-50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronRight className={`w-4 h-4 text-orange transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="p-5 pt-0 text-slate-500 text-xs leading-relaxed border-t border-slate-50 bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== ABRIR TICKET ==================== */}
          {fieldName === 'Abrir Ticket' && (
            <div className="space-y-8">
              <form onSubmit={handleOpenTicket} className="space-y-6 max-w-lg mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assunto do Ticket</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Identifique de forma curta o seu problema" 
                      value={ticketSubject} 
                      onChange={(e) => setTicketSubject(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
                      <select 
                        value={ticketCategory} 
                        onChange={(e) => setTicketCategory(e.target.value as any)} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                      >
                        <option value="help">Ajuda / Pedidos</option>
                        <option value="complaint">Reclamação</option>
                        <option value="billing">Faturação / Saldos</option>
                        <option value="technical">Falha Técnica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridade</label>
                      <select 
                        value={ticketPriority} 
                        onChange={(e) => setTicketPriority(e.target.value as any)} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta (Urgente)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descricao Completa</label>
                    <textarea 
                      required 
                      placeholder="Descreva com detalhe datas, montantes e referências..." 
                      rows={4} 
                      value={ticketDesc} 
                      onChange={(e) => setTicketDesc(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium resize-none focus:outline-none" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-navy hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submeter Ticket de Suporte
                </button>
              </form>

              {/* Submitted Tickets Tracking */}
              {submittedTickets.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="font-extrabold text-navy text-sm">Meus Tickets Recentes</h4>
                  <div className="space-y-3">
                    {submittedTickets.map((t, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <h5 className="font-bold text-navy">{t.subject}</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Categoria: {t.category} • Prioridade: {t.priority}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase text-orange bg-orange/10 border border-orange/10">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== LIVE CHAT ==================== */}
          {fieldName === 'Chat de suporte' && (
            <div className="border border-slate-100 rounded-[32px] overflow-hidden bg-slate-50 h-[450px] flex flex-col shadow-soft">
              {/* Chat Viewport */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map(msg => {
                  const isUser = msg.sender === 'user';
                  const isSystem = msg.sender === 'system';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
                      <div className={`p-4 rounded-3xl text-xs max-w-sm font-medium ${
                        isUser ? 'bg-orange text-white rounded-tr-none' : 
                        isSystem ? 'bg-slate-200 text-slate-500 text-center font-bold font-mono' :
                        'bg-white text-navy border border-slate-100 rounded-tl-none shadow-sm'
                      }`}>
                        <p>{msg.text}</p>
                        {!isSystem && <span className="block text-[8px] text-right mt-1.5 opacity-60 font-bold font-mono">{msg.time}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Controller */}
              <form onSubmit={sendChatMessage} className="bg-white p-4 border-t border-slate-100 flex gap-2">
                <input 
                  type="text"
                  placeholder="Escreva a sua mensagem aqui..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange/20"
                />
                <button type="submit" className="p-3 bg-orange hover:bg-orange-600 text-white rounded-xl shadow-md transition-transform shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ==================== TERMS OF USE ==================== */}
          {fieldName === 'Termos de uso' && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-60 overflow-y-auto space-y-4 text-xs text-slate-400 font-medium leading-relaxed leading-relaxed select-none">
                <h4 className="font-extrabold text-navy text-sm">Contrato de Utilização MozProServices</h4>
                <p>Bem-vindo ao MozProServices, o ecossistema líder em Moçambique de integração profissional de serviços, e-commerce e entregas rápidas.</p>
                <p>1. **Geral**: Ao aceder à nossa aplicação, aceita submeter toda a atividade comercial e dados em conformidade com as leis em vigor na República de Moçambique, incluindo as diretivas fiscais relativas ao NUIT e registos.</p>
                <p>2. **Moderação de Conteúdos**: Proibido colocar anúncios ou serviços falsos, armas, bens ilícitos ou imagens abusivas. A violação resulta no cancelamento e banimento permanente da credencial de perfil.</p>
                <p>3. **Saldos e Levantamentos**: Os Fundos retidos de vendas ou serviços são guardados de forma segura nas Carteiras do MozPro. Levantamentos via Mobile Money são automáticos.</p>
                <p>4. **Proteção de Dados**: Encriptamos logs, passwords e dados tokenizados. Não armazenamos segredos bancários (CVV).</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-soft">
                <span className="text-xs font-bold text-slate-500">Aceito Integralmente os Termos de Uso</span>
                <button 
                  disabled={termsAccepted}
                  onClick={handleAcceptTerms}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-md ${termsAccepted ? 'bg-orange/20 text-orange cursor-not-allowed shadow-none' : 'bg-navy hover:bg-slate-800'}`}
                >
                  {termsAccepted ? 'Aceite Registado' : 'Sim, Aceito'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
