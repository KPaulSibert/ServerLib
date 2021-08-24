import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stepper, TextField, } from "@material-ui/core";
import {reactInp,POST, reactSwitch, GlobalState} from "./utils"
import React, { useEffect, useState } from "react";
export var User = new GlobalState({})
export default function Logindialog(props){
	const [$name,name] = reactInp()
	const [$email,email] = reactInp()
	const [$pwd,password] = reactInp()
	const [isLogin,switchLogin] = reactSwitch(true)
	const login = async (e)=>{
		e.preventDefault()
		const ret = await (await POST('/api/public/login',{email,password})).json()
		User.setValue(ret)
	}
	const register = async (e)=>{
		e.preventDefault()
		const ret = await (await POST('/api/public/signup',{email,password,name})).json()
		User.setValue(ret)
	}
	return (<>
		<Dialog open>
			<DialogTitle>Login</DialogTitle>
				<DialogContent>
					<DialogContentText>
						To visit this content, please login here.
					</DialogContentText> 
					<TextField autoFocus label="Email Address" type="email" fullWidth {...$email}/>
					<TextField margin="dense" id="password" label="Password"  type="password" {...$pwd}fullWidth/>
				</DialogContent>
					<DialogActions>
				<Button onClick={switchLogin} variant="contained" color="primary">Register</Button>
				<Button onClick={login} variant="contained" color="primary" type="submit">Login</Button>
			</DialogActions>
		</Dialog>
		<Dialog open={!isLogin}>
			<DialogTitle>Sign Up</DialogTitle>
				<DialogContent>
					<TextField autoFocus label="Your Name" type="text" fullWidth {...$name}/>
					<TextField autoFocus label="Email Address" type="email" fullWidth {...$email}/>
					<TextField margin="dense" id="password" label="Password"  type="password" {...$pwd}fullWidth/>
				</DialogContent>
					<DialogActions>
				<Button onClick={switchLogin} variant="contained" color="secondary">Login</Button>
				<Button onClick={register} variant="contained" color="primary">Sign Up</Button>
			</DialogActions>
		</Dialog>
	 </>);
}
POST('/api/public/getuser').then(async r=>User.setValue(await r.json()))