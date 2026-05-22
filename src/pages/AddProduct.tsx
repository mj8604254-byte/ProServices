import React, { useState } from 'react';
import { Camera, Video, Package, Tag, Truck, Info, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES } from '../constants';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES.products[0],
    subcategory: '',
    description: '',
    price: '',
    promoPrice: '',
    stock: '',
    unit: 'unidade',
    weight: '',
    dimensions: { h: '', w: '', l: '' },
    location: '',
    estimatedDelivery: '',
    brand: '',
    warranty: '',
    condition: 'novo',
    availability: 'imediato',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('products').insert({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        unit: formData.unit,
        location: formData.location,
        availability: formData.availability,
        seller_id: user.id,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60', // Placeholder
        moderation_status: 'pending',
        rating: 5,
        reviews_count: 0,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      alert('Produto cadastrado com sucesso!');
      navigate('/products');
    } catch (error) {
      handleSupabaseError(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-navy mb-6 font-bold text-sm">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-navy p-8 text-white">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Cadastrar Novo Produto</h1>
          <p className="text-slate-400">Preencha todos os detalhes para maximizar as suas vendas.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-12">
          {/* Basic Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <Package className="w-5 h-5 text-orange" />
              <h2 className="font-black text-navy uppercase tracking-widest text-sm">Informações Básicas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Produto</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Arroz Premium 25kg"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.products.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="unidade">Unidade</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="litro">Litro (l)</option>
                  <option value="pacote">Pacote</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição Detalhada</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Funcionalidades, benefícios e características principais..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço Normal (MT)</label>
                <input 
                  required
                  type="number" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantidade em Stock</label>
                <input 
                  required
                  type="number" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Visuals */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <Camera className="w-5 h-5 text-orange" />
              <h2 className="font-black text-navy uppercase tracking-widest text-sm">Informações Visuais</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                <Camera className="w-6 h-6 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">Principal</span>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-slate-100">
                  <Camera className="w-6 h-6 text-slate-200" />
                </div>
              ))}
            </div>
          </section>

          {/* Logistics */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <Truck className="w-5 h-5 text-orange" />
              <h2 className="font-black text-navy uppercase tracking-widest text-sm">Logística e Entrega</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cidade/Localização</label>
                <input 
                  type="text" 
                  placeholder="Ex: Maputo"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tempo Estimado</label>
                <input 
                  type="text" 
                  placeholder="Ex: 2-3 dias"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.estimatedDelivery}
                  onChange={e => setFormData({...formData, estimatedDelivery: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Disponibilidade</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                  value={formData.availability}
                  onChange={e => setFormData({...formData, availability: e.target.value})}
                >
                  <option value="imediato">Imediato</option>
                  <option value="sob encomenda">Sob Encomenda</option>
                </select>
              </div>
            </div>
          </section>

          <button 
            type="submit"
            className="w-full py-6 bg-orange text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-orange/20 hover:scale-[1.02] transition-transform active:scale-95"
          >
            Publicar Produto agora
          </button>
        </form>
      </div>
    </div>
  );
}
