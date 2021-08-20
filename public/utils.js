import React, { useState ,useEffect} from "react";
export function POST(url,data=null){return fetch(url,{credentials: "same-origin",method:'POST',body:JSON.stringify(data)})}
export function reactInp(def=""){
    const [val,change] = useState(def)
    const changed = (e)=>{change(e.target.value)}
    return [{value:val,onChange:changed},val]
}
export function reactSwitch(def=false){
    const [val,change] = useState(def)
    const switc = ()=>{change(!val)}
    return [val,switc]
}
export function GlobalState(initialValue) {
    this.value = initialValue;  // Actual value of a global state
    this.subscribers = [];     // List of subscribers
    this.getValue = function () {
        // Get the actual value of a global state
        return this.value;
    }

    this.setValue = function (newState) {
        console.log('updateState',newState)
        if (this.getValue() === newState) {return}
        this.value = newState;  // Update global state value
        this.subscribers.forEach(subscriber => {
            // Notify subscribers that the global state has changed
            subscriber(this.value);
        });
    }

    this.subscribe = function (itemToSubscribe) {
        // This is a function for subscribing to a global state
        if (this.subscribers.indexOf(itemToSubscribe) > -1) {
            // Already subsribed
            return
        }
        // Subscribe a component
        this.subscribers.push(itemToSubscribe);
    }

    this.unsubscribe = function (itemToUnsubscribe) {
        // This is a function for unsubscribing from a global state
        this.subscribers = this.subscribers.filter(
            subscriber => subscriber !== itemToUnsubscribe
        );
    }
}
export function useGlobalState(globalState) {
    const [, update] = useState();
    const state = globalState.getValue();

    function reRender(){update({})}

    useEffect(() => {
        // Subscribe to a global state when a component mounts
        globalState.subscribe(reRender);
        return () => {globalState.unsubscribe(reRender);}
    })

    function setState(newState) {
        globalState.setValue(newState);
    }

    return [state, setState];
}