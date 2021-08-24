import React from "react"
import { Button, Container, Modal, Navbar, NavDropdown } from "react-bootstrap"
import { User } from "./login"
import { reactSwitch, useGlobalState } from "./utils"
import {css} from "./GUICore"
export default function(p){
    const [open,$open] = reactSwitch(false)
    return <Container>
        <Navbar variant="dark" bg="primary"> 
            <Container fluid>
                <Navbar.Brand>Hello</Navbar.Brand>
                <Button onClick={$open}>Hello World</Button>
                <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                    <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                </NavDropdown>
            </Container>
        </Navbar>
        <Modal show={open}>
            <Modal.Header>Login</Modal.Header>
            <Modal.Body>
                Hello World
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={$open}>Close</Button>
            </Modal.Footer>
        </Modal>
    </Container>
    
}
css({
    '.navbar':{backgroundColor:'red'}
})