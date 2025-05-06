
import React from 'react';
import RegistrationForm from '../components/registration/RegistrationForm';
import FaceCaptureSection from '../components/registration/FaceCaptureSection';
import { useFaceRegistration } from '../hooks/useFaceRegistration';

const Register: React.FC = () => {
  const {
    username,
    setUsername,
    capturedFaces,
    modelLoaded,
    usernameError,
    setUsernameError,
    registrationStep,
    isTakingPictures,
    setIsTakingPictures,
    requiredFaceCount,
    handleStartCapture,
    handleFaceCapture,
    handleSubmitRegistration,
    resetRegistration,
    handleManualCapture
  } = useFaceRegistration();

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      {registrationStep === 'form' ? (
        <RegistrationForm
          username={username}
          setUsername={setUsername}
          usernameError={usernameError}
          setUsernameError={setUsernameError}
          onStartCapture={handleStartCapture}
          modelLoaded={modelLoaded}
        />
      ) : (
        <FaceCaptureSection
          capturedFaces={capturedFaces}
          onFaceCapture={handleFaceCapture}
          onReset={resetRegistration}
          onSubmit={handleSubmitRegistration}
          requiredFaceCount={requiredFaceCount}
          isTakingPictures={isTakingPictures}
          setIsTakingPictures={setIsTakingPictures}
          handleManualCapture={handleManualCapture}
        />
      )}
    </div>
  );
};

export default Register;
