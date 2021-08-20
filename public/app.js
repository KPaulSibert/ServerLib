import React from "react"
import { BrowserRouter as Router, Switch,Route } from "react-router-dom"
import Homepage from "./homepage"
import Login from "./login"
export default function(p){
    return <Router>
        <Switch>
            <Route path="/login">
                <Login/>
            </Route>
            <Route path="/">
                <Homepage/>
            </Route>
        </Switch>
    </Router>
}