
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { getCurrentUser, clearCurrentUser, getUserFaces } from '../services/authService';
import { FaceImage } from '../models/faceTypes';
import { toast } from '../components/ui/sonner';
import FaceImageGrid from '../components/FaceImageGrid';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState<string | null>(null);
  const [faceImages, setFaceImages] = React.useState<FaceImage[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      toast.error('You must be logged in to view this page');
      navigate('/login');
      return;
    }
    
    setUsername(currentUser);
    setFaceImages(getUserFaces(currentUser));
  }, [navigate]);

  const handleLogout = () => {
    clearCurrentUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Welcome, {username}!</CardTitle>
          <CardDescription>
            You've successfully authenticated with facial recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="bg-green-500 text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-800">Authentication Successful</h3>
                <p className="text-green-700">Your identity has been verified using facial recognition</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogout} variant="outline" className="ml-auto">
            Logout
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Registered Face Profile</CardTitle>
          <CardDescription>
            These are the facial images used to verify your identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaceImageGrid 
            images={faceImages} 
            title="Registered Face Images" 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
