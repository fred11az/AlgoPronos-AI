export type Database = {
  public: {
    Tables: {
      [_ in string]: {
        Row: {
          [_ in string]: any
        }
        Insert: {
          [_ in string]: any
        }
        Update: {
          [_ in string]: any
        }
      }
    }
    Views: {
      [_ in string]: any
    }
    Functions: {
      [_ in string]: any
    }
    Enums: {
      [_ in string]: any
    }
  }
}
