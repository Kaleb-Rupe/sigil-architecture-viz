import ExcalidrawWrapper from '@/components/ExcalidrawWrapper';
import { listSnapshots } from '@/lib/list-snapshots';

export default async function Home() {
  const snapshots = await listSnapshots();
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ExcalidrawWrapper snapshotKey="canonical" snapshots={snapshots} />
    </main>
  );
}
