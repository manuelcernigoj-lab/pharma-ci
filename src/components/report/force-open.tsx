import { createContext, useContext } from "react";

export const ForceOpenContext = createContext<boolean>(false);
export const useForceOpen = () => useContext(ForceOpenContext);
