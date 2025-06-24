

CREATE TABLE users(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, 
  email_address VARCHAR(320) UNIQUE NOT NULL,
  password_hashed TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(email_address) >= 6)  
);