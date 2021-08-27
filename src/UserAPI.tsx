import { sha256 } from "js-sha256"
import ISession from './interfaces.d';

class UserAPI {
    private BASE_URL: string
    private DEFAULT_HEADER: {}
    
    useSession: {
        setSession: (session: ISession | undefined) => Promise<void>;
        session: ISession;
    }

    /**
     * @param host URL to login-service, like https://address.com/v1/root
     * @param useSession pass the hook created with useSession()
     * @param header pass Map<String, String> if you want to set header 
     * of requests
     */
    constructor(
        host: string, 
        useSession: {
            setSession: (session: ISession | undefined) => Promise<void>;
            session: ISession;
        }, 
        header?: string
    ) {
        if(!host || host.replace(" ", "") == "" || !host.startsWith("https://")) throw Error("invalid host")
        if(host.endsWith("/")) throw Error("host shouldnt end with /")
        if(useSession == null || undefined) throw Error("invalid session")

        this.BASE_URL = `${host}`
        this.useSession = useSession
        this.DEFAULT_HEADER = header == null || header == undefined 
            ? { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            : header
    }

    /**
     * This method execute login and update useSession hook. 
     * 
     * @returns 200 if ok; 404 if not found; Error otherwise
     */
    login = async (username: string, password: string): Promise<number> => {
        const response = this.handleAPIResponse(
            fetch(`${this.BASE_URL}/login`, {
                method: 'POST',
                headers: this.DEFAULT_HEADER,
                body: JSON.stringify({
                    username: username,
                    password: sha256(password)
                })
            })
        )

        return response
            .then(data => {
                if(typeof data == 'number') return response

                return this.useSession
                    .setSession(data)
                    .then(suc => 200)
                    .catch(err => 500)
            })
            .catch(err => 500)
    }
    
    updatePassword = (username: string, password: string, newPassword: string): Promise<number> => {
        return this.handleAPIResponse(
            fetch(`${this.BASE_URL}/`, {
                method: 'PUT',
                headers: this.DEFAULT_HEADER,
                body: JSON.stringify({
                    username: username,
                    password: password,
                    newPassword: newPassword
                })
            })
        )
    }
    
    /**
     * This method execute updateUser and update useSession hook. 
     * So, you don't need to update it again and you should'nt 
     * update without this method.
     * 
     * @returns 200 if ok; 404 if not found; Error otherwise
     */
    updateUser = (username: string, password: string, newUsername: string): Promise<number> => {
        const response = this.handleAPIResponse(
            fetch(`${this.BASE_URL}/`, {
                method: 'PUT',
                headers: this.DEFAULT_HEADER,
                body: JSON.stringify({
                    username: username,
                    password: password,
                    newUsername: newUsername
                })
            })
        )

        return response
            .then(data => {
                if(typeof data == 'number') return data

                const tempSession = this.useSession.session
                return this.useSession
                .setSession({
                    id: tempSession.id,
                    username: newUsername,
                    password: undefined
                })
                .then(suc => 200)
                .catch(err => 500)
            })
            .catch(err => 500)
    }
    
    /**
     * This method returns if username already exists
     * @returns 200 if exists; 404 if not; Error otherwise
     */
    exists = (username: String): Promise<number> => {
        return this.handleAPIResponse(
            fetch(`${this.BASE_URL}/${username}/exists`, {
                method: 'GET',
                headers: this.DEFAULT_HEADER
            })
        )
    }

    private handleAPIResponse = (response: Promise<Response>) => {
        return response
            .then(data => {
                const status = data.status
                if(status == 200) return data.json()
                if(status < 500) return status
                return Error("Internal Server Error")
            })
            .catch(err => 500)
    }
}

export default UserAPI
