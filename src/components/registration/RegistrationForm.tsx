
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getUserByUsername } from '../../services/authService';

interface RegistrationFormProps {
  username: string;
  setUsername: (username: string) => void;
  usernameError: string;
  setUsernameError: (error: string) => void;
  onStartCapture: () => void;
  modelLoaded: boolean;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  username,
  setUsername,
  usernameError,
  setUsernameError,
  onStartCapture,
  modelLoaded
}) => {
  const navigate = useNavigate();

  const validateUsername = () => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      setUsernameError('Username already exists');
      return false;
    }
    
    setUsernameError('');
    return true;
  };

  const handleStartCapture = () => {
    if (validateUsername()) {
      onStartCapture();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Face Authentication Registration</CardTitle>
        <CardDescription>
          Create an account secured by your face
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!modelLoaded ? (
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Loading face detection model...
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                placeholder="Enter a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={usernameError ? "border-red-500" : ""}
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We'll capture 10 images of your face for secure authentication.
                Please ensure you're in a well-lit area and position your face
                clearly in the camera frame.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </Button>
        <Button
          onClick={handleStartCapture}
          disabled={!modelLoaded}
        >
          Start Face Capture
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RegistrationForm;
