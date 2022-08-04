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
        <div className='User-Title'>
        <h1> Hello {props.options[0].name}  </h1>
        <h3><b>Options:</b></h3>
        </div>
        <div className='User-Name'>
        <label>Change your name: </label>
        <br/>
        <label>Current name: {props.options[0].name}</label>
        <br/>
        <input type="text" value={newName} maxLength="30" onChange={(e) => setNewName(e.target.value.replace(/^\s*$/, ''))}/>
        <input className='raise-button' type="button" value={"submit"} onClick={() => changeNewName()} disabled={newName.length === 0} />
        <br/>
        </div>
        <div className='User-Status'>
        <label>You are a DM?</label>
        <br/>
        <label>{props.options[0].isDM ? "Actually you are a DM." : "Actually you are not a DM."}</label>
        <br/>
        <input className='raise-button' type="button" value={"Change status"} onClick={() => {changeIsDm(); setBtnDisabled(true)} } disabled={btnDisabled}/>
        <br/>
        </div>
        <div className='User-Style'>
        <label>Select your style: </label>
        (For Future Updates!)
        <br/>
        <input className='raise-button' disabled type="button" value={"style A"} /><input className='raise-button' disabled type="button" value={"style B"} /><input className='raise-button' disabled type="button" value={"style C"} />
        <br/>
        </div>
        <div className='User-Delete'>
        <label>Delete account: 
        <label className="label">
         -
         <div className="toggle">
         <input className="toggle-state" type="checkbox" defaultChecked={toggleAccDel} onClick={() =>  setToggleAccDel(!toggleAccDel)} />
         <div className="indicator"></div>
         </div>
         -
         </label>
         </label>
        {toggleAccDel ?
        <>
        <br/><input className='raise-button' type="button" value={"submit"} onClick={() => deleteAccount()} />
        </>
        : null}
        </div>
        </div>
    )
}



export default User;