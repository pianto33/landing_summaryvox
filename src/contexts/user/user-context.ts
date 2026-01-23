import { createContext, Dispatch, SetStateAction } from "react";

interface Context {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}

const UserContext = createContext<Context>({} as Context);

export default UserContext;
