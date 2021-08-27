import { useState } from "react"
import ISession from './interfaces.d';

/**
 * Create only 1 instance of this hook
 * @returns \{ session, setSession }
 */
export default function useSession() {
    const ID_KEY = 'id'
    const USER_KEY = "user"
    
    const getSession = (): ISession => {
        const id = sessionStorage.getItem(ID_KEY)
        const username = sessionStorage.getItem(USER_KEY)
        if(id && username) {
            return { 
                id: id,
                username: username,
                password: undefined
            }
        }
        saveSession(undefined)
        return undefined
    }

    const saveSession = async (session: ISession | undefined): Promise<void> => {
        if(!session || !session.username) {
            clearCache()
            return Promise.reject()
        }
        setCache(session.id, session.username)
        setSession(session)
        return Promise.resolve()
    }

    const [currSession, setSession] = useState<ISession>(undefined)

    const clearCache = (): void => {
        sessionStorage.removeItem(ID_KEY)
        sessionStorage.removeItem(ID_KEY)
    }

    const setCache = (id: string, username: string): void => {
        sessionStorage.setItem(ID_KEY, id)
        sessionStorage.setItem(USER_KEY, username)
    }

    return {
        setSession: saveSession,
        session: getSession()
    }
}
