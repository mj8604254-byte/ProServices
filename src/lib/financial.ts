import { supabase } from './supabase';
import { Transaction, UserRole } from '../types';

const COMMISSION_RATES = {
  [UserRole.CUSTOMER]: 0,
  [UserRole.SELLER_MICRO]: 0.10, // 10%
  [UserRole.SELLER_MACRO]: 0.05, // 5%
  [UserRole.SERVICE_PROVIDER]: 0.15, // 15%
  [UserRole.DELIVERER]: 0, // Deliverers get fixed fee or full amount
  [UserRole.AFFILIATE]: 0.02, // 2% from platform cut
  [UserRole.ADMIN]: 0,
};

export const finance = {
  // Retains payment in escrow
  async createEscrow(orderId: string, amount: number, customerId: string) {
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: customerId,
      amount: -amount,
      type: 'debit',
      status: 'pending',
      description: `Pagamento retido (Escrow) para pedido #${orderId.slice(0, 8)}`,
      related_order_id: orderId,
      created_at: new Date().toISOString()
    });

    if (txError) throw txError;

    // Update customer wallet (pending) - In real app, use an RPC for atomic increment
    const { data: wallet } = await supabase.from('wallets').select('pending_balance').eq('user_id', customerId).single();
    const newPending = (wallet?.pending_balance || 0) + amount;
    
    await supabase.from('wallets').update({
      pending_balance: newPending,
      updated_at: new Date().toISOString()
    }).eq('user_id', customerId);
  },

  // Finalizes order and splits the values
  async releaseEscrow(orderId: string, amount: number, sellerId: string, sellerRole: UserRole, deliverablesId?: string, affiliateId?: string) {
    const platformRate = COMMISSION_RATES[sellerRole] || 0.10;
    const platformCut = amount * platformRate;
    const affiliateCut = affiliateId ? amount * 0.02 : 0;
    const sellerGross = amount - platformCut;
    
    // In Supabase, we should ideally use a stored procedure (RPC) for atomicity
    // But for this migration, we'll use individual calls or build a single batch if possible.
    // Supabase JS doesn't have a direct 'transaction' helper like Firestore's runTransaction,
    // it's usually handled on the DB side via functions.
    
    try {
      // 1. Credit Seller
      const { data: sellerWallet } = await supabase.from('wallets').select('available_balance').eq('user_id', sellerId).single();
      await supabase.from('wallets').update({
        available_balance: (sellerWallet?.available_balance || 0) + sellerGross,
        updated_at: new Date().toISOString()
      }).eq('user_id', sellerId);

      // 2. Create Seller Transaction Log
      await supabase.from('transactions').insert({
        user_id: sellerId,
        amount: sellerGross,
        type: 'credit',
        status: 'completed',
        description: `Venda concluída #${orderId.slice(0, 8)}`,
        related_order_id: orderId,
        created_at: new Date().toISOString()
      });

      // 3. Credit Affiliate if exists
      if (affiliateId) {
        const { data: affWallet } = await supabase.from('wallets').select('available_balance').eq('user_id', affiliateId).single();
        await supabase.from('wallets').update({
          available_balance: (affWallet?.available_balance || 0) + affiliateCut,
          updated_at: new Date().toISOString()
        }).eq('user_id', affiliateId);
        
        await supabase.from('transactions').insert({
          user_id: affiliateId,
          amount: affiliateCut,
          type: 'commission',
          status: 'completed',
          description: `Comissão de afiliado #${orderId.slice(0, 8)}`,
          related_order_id: orderId,
          created_at: new Date().toISOString()
        });
      }

      // 4. Update order status
      await supabase.from('orders').update({
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

    } catch (err) {
      console.error('Error releasing escrow:', err);
      throw err;
    }
  },

  async requestPayout(userId: string, amount: number, method: 'mpesa' | 'emola' | 'bank', methodDetails: string) {
    const { error: payoutError } = await supabase.from('payouts').insert({
      user_id: userId,
      amount,
      method,
      method_details: methodDetails,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    if (payoutError) throw payoutError;

    // Move from available to pending in wallet
    const { data: wallet } = await supabase.from('wallets').select('available_balance, pending_balance').eq('user_id', userId).single();
    await supabase.from('wallets').update({
      available_balance: (wallet?.available_balance || 0) - amount,
      pending_balance: (wallet?.pending_balance || 0) + amount,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
  }
};
