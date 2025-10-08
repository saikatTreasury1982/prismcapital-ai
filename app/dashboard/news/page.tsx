import { getNewsTypes, getNewsStatuses } from '../../services/newsService';
import { NewsClientWrapper } from '../../components/news/NewsClientWrapper';

export default async function NewsPage() {
  try {
    const [newsTypes, newsStatuses] = await Promise.all([
      getNewsTypes(),
      getNewsStatuses()
    ]);

    return (
      <NewsClientWrapper 
        newsTypes={newsTypes}
        newsStatuses={newsStatuses}
      />
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading News</h2>
          <p className="text-rose-200">{error.message}</p>
        </div>
      </div>
    );
  }
}