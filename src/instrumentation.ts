export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const { prisma } = await import('@/lib/db');

  setInterval(async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      await prisma.notification.deleteMany({
        where: { created_at: { lt: ninetyDaysAgo } },
      });
      console.log('Periodic notification cleanup completed.');
    } catch (err) {
      console.error('Periodic notification cleanup failed:', err);
    }
  }, 24 * 60 * 60 * 1000);
}
