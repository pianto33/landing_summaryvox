import UserContext from "@/contexts/user/user-context";
import { useState } from "react";

interface Props {
  children: React.ReactNode;
}

function UserProvider({ children }: Props) {
  const [email, setEmail] = useState("");

  return (
    <UserContext.Provider value={{ email, setEmail }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
