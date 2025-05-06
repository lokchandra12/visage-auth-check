
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Face Recognition Authentication</CardTitle>
          <CardDescription className="text-lg">
            Secure your account using facial biometrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 9a3 3 0 0 1 0-6h4a3 3 0 0 1 0 6H2Z"/><path d="M18 9h4a3 3 0 0 0 0-6h-4a3 3 0 0 0 0 6Z"/><path d="M2 9v12h20V9"/><path d="M16 17a4 4 0 0 1-8 0"/></svg>
            </div>
            <p className="text-center max-w-md">
              This system uses facial recognition technology to authenticate users. 
              Register once with 10 facial images, then log in anytime by verifying your face.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="p-4 border rounded-lg bg-white text-center">
                <div className="text-xl font-bold">10</div>
                <div className="text-sm text-muted-foreground">Images for Registration</div>
              </div>
              <div className="p-4 border rounded-lg bg-white text-center">
                <div className="text-xl font-bold">80%</div>
                <div className="text-sm text-muted-foreground">Match Threshold</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            onClick={() => navigate('/login')} 
            className="w-full"
          >
            Login with Face ID
          </Button>
          <Button 
            onClick={() => navigate('/register')} 
            variant="outline" 
            className="w-full"
          >
            Register New User
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
