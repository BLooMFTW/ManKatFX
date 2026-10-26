import { getSupabase } from './client';

export type RealtimeChangePayload = {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: any;
  oldRecord: any;
};

export function subscribeToRealtimeSync(
  userId: string,
  onSync: (payload: RealtimeChangePayload) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase || !userId || userId === 'demo') {
    return () => {};
  }

  const channel = supabase
    .channel(`mankatfx_sync_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` },
      (payload) => {
        onSync({
          table: 'trades',
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
      (payload) => {
        onSync({
          table: 'accounts',
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'strategies', filter: `user_id=eq.${userId}` },
      (payload) => {
        onSync({
          table: 'strategies',
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
      (payload) => {
        onSync({
          table: 'goals',
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'backtests', filter: `user_id=eq.${userId}` },
      (payload) => {
        onSync({
          table: 'backtests',
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
