export interface Ticket {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface ApiError {
    error: {
      code: string;
      message: string;
    };
  }