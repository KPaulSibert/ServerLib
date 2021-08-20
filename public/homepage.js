import React from "react"
import { User } from "./login"
import { useGlobalState } from "./utils"
export default function(p){
    const [user] = useGlobalState(User)
    return <div>Hello, {user.email||''}</div>
}