import { ListingForm } from "@/src/components/property/ListingForm";

export default function TestListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          Test Listing Form
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
          <ListingForm onSuccess={() => {
            console.log("Form submitted successfully!");
            alert("Form submitted successfully!");
          }} />
        </div>
      </div>
    </div>
  );
}