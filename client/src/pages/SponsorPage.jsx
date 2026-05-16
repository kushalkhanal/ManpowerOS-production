import SponsorSection from '../components/directory/SponsorSection';

const SponsorPage = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Sponsors</h1>
        <p className="text-sm text-gray-500 mt-1">Manage sponsors and their associated candidates.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4 min-h-[calc(100vh-180px)]">
        <SponsorSection />
      </div>
    </div>
  );
};

export default SponsorPage;
