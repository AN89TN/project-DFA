import React, { useState } from 'react';
import { sendUserDataService } from "./../services/auth";

function User(props) {

    const [newName, setNewName] = useState("");
    const [toggleAccDel, setToggleAccDel] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);

    const deleteAccount = async () => {
        var dataAcc = {
            command: "DELETE_ACCOUNT",
            data: {
                id: props.cookie.user._id
            }
        };
        await sendUserDataService(dataAcc);
        props.dataUser();
        props.logOut();
    };

    const changeIsDm = async () => {
        var dataIsDm = {
            command: "CHANGE_DM",
            data: {
                isDM: !props.options[0].isDM
            }
        }
        await sendUserDataService(dataIsDm);
        setTimeout(() => setBtnDisabled(false), 2000);
        props.dataUser();
    }

    const changeNewName = async () => {
        var dataNewName = {
            command: "CHANGE_NAME",
            data: {
                name: newName
            }
        }
        await sendUserDataService(dataNewName);
        setNewName("");
        props.dataUser();
    }






    return (
        <div className="User">
        <h1> Hello {props.options[0].name}  </h1>
        <h3><b>Options:</b></h3>
        <label>Change your name: </label>
        <br/>
        <label>Current name: {props.options[0].name}</label>
        <br/>
        <input type="text" value={newName} maxLength="30" onChange={(e) => setNewName(e.target.value.replace(/^\s*$/, ''))}/>
        <input type="button" value={"submit"} onClick={() => changeNewName()} disabled={newName.length === 0} />
        <br/>
        <label>You are a DM?</label>
        <br/>
        <label>{props.options[0].isDM ? "Actually you are a DM." : "Actually you are not a DM."}</label>
        <br/>
        <input type="button" value={"Change status"} onClick={() => {changeIsDm(); setBtnDisabled(true)} } disabled={btnDisabled}/>
        <br/>
        <label>Select your style: </label>
        <br/>
        <input type="button" value={"style A"} /><input type="button" value={"style B"} /><input type="button" value={"style C"} />
        <br/>
        <label>Delete account: </label>
        <label className="label">
         -
         <div className="toggle">
         <input className="toggle-state" type="checkbox" defaultChecked={toggleAccDel} onClick={() =>  setToggleAccDel(!toggleAccDel)} />
         <div className="indicator"></div>
         </div>
         -
         </label>
        {toggleAccDel ?
        <>
        <br/><input type="button" value={"submit"} onClick={() => deleteAccount()} />
        </>
        : null}
        </div>
    )
}



export default User;