import StaffSection from '../components/directory/StaffSection';
import SponsorSection from '../components/directory/SponsorSection';

const DirectoryPage = () => {
  return (
    <div className="px-4 py-6 sm:px-0 h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-4">
          <StaffSection />
        </div>
        
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-4">
          <SponsorSection />
        </div>
      </div>
    </div>
  );
};

export default DirectoryPage;