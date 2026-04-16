import ExcalidrawWrapper from '@/components/ExcalidrawWrapper';
import NavMenu from '@/components/NavMenu';
import { listSnapshots } from '@/lib/list-snapshots';

export default async function Home() {
  const snapshots = await listSnapshots();
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ExcalidrawWrapper />
      <NavMenu currentSlug="canonical" snapshots={snapshots} />
    </main>
  );
}
