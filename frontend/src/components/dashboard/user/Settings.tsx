import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useView } from "@/context/ViewContext";
import { useTour } from "@/context/TourContext";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";

export default function SettingsComponent() {
  const user = useSelector((state: RootState) => state.user);
  const { setCurrentView } = useView();
  const { resetTour, startTour } = useTour();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
  });

  // Set current view when component mounts
  useEffect(() => {
    setCurrentView("settings");
  }, [setCurrentView]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement settings update
    console.log("Settings updated:", formData);
  };

  const handleRestartTour = () => {
    resetTour();
    // Navigate to home page to start the tour
    navigate('/dashboard/home');
    // Start the tour after a brief delay
    setTimeout(() => {
      startTour();
    }, 500);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Profile Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                phone: "",
              })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Tour Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mt-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Getting Started Tour</h2>
        <p className="text-gray-600 mb-4">
          Take a guided tour to learn how to create your profile and first job application.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleRestartTour}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restart Tour
        </Button>
      </div>
    </div>
  );
}
