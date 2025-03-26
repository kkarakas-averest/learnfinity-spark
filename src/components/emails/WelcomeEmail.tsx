import React from 'react';
import { WelcomeEmailProps } from '@/types/email.types';

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstName,
  credentials,
  learningPath
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px', textAlign: 'center' }}>
        <h1 style={{ color: '#343a40', marginBottom: '20px' }}>Welcome to Learnfinity, {firstName}!</h1>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#495057' }}>
            We're excited to have you join our learning platform. Your personalized learning journey has been created to help you grow and succeed in your role.
          </p>
          
          <div style={{ backgroundColor: '#f1f3f5', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
            <h2 style={{ color: '#343a40', fontSize: '20px' }}>Your Learning Path</h2>
            <h3 style={{ color: '#495057', fontSize: '18px' }}>{learningPath.title}</h3>
            <p style={{ color: '#6c757d', fontSize: '15px' }}>{learningPath.description}</p>
            <p style={{ color: '#6c757d', fontSize: '15px' }}>Estimated Duration: {learningPath.estimatedDuration}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#343a40', fontSize: '20px' }}>Getting Started</h2>
            <p style={{ color: '#495057', fontSize: '16px' }}>Here are your login credentials:</p>
            <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px' }}>
              <p style={{ margin: '5px 0', fontSize: '15px' }}>Email: <strong>{credentials.email}</strong></p>
              <p style={{ margin: '5px 0', fontSize: '15px' }}>Temporary Password: <strong>{credentials.temporaryPassword}</strong></p>
              <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>Important: Please change your password upon first login.</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a 
              href="https://learnfinity.ai/login" 
              style={{ 
                display: 'inline-block', 
                backgroundColor: '#4361ee', 
                color: 'white', 
                padding: '12px 25px', 
                textDecoration: 'none', 
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Start Your Learning Journey
            </a>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', color: '#6c757d', fontSize: '14px' }}>
          <p>Best regards,<br />The Learnfinity Team</p>
        </div>
      </div>
    </div>
  );
}; 