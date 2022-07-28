import React, { useState, useEffect } from 'react';
import { sendUserDataService, reciveUserDataService, userLogoutService, setAuthToken } from "./../services/auth";
import io from "socket.io-client";

function Room(props) {

        const [room, setRoom] = useState("");
        const [roomConnected, setRoomConnected] = useState(true);
        const [socket, setSocket] = useState(null);
        const [socketConnected, setSocketConnected] = useState(false);
        const [dt, setDt] = useState("");
        const [result, setResult] = useState([]);
        const [customRolls, setCustomRolls] = useState([]);
        const [customRollName, setCustomRollName] = useState("");
        const [crFaces, setCrFaces] = useState("1");
        const [crQuantity, setCrQuantity] = useState("1");
        const [crBonus, setCrBonus] = useState("0");
        const [crMalus, setCrMalus] = useState("0");
        const [crTot, setCrTot] = useState([]);
        const [getOptions] = props.options;
        const [setAuthStatus] = props.auth;
        const [dmSecretRollFaces, setDmSecretRollFaces] = useState("20");
        const [dmSecretRollResult, setDmSecretRollResult] = useState("20");

        var id = () => new Date().valueOf().toString(36) + Math.random().toString(36).slice(2);

        useEffect(() => {
          const getDataUser = async () => {
            const result = await reciveUserDataService();
            if (result.error) return (userLogoutService(), setAuthStatus(false), setAuthToken(""), localStorage.setItem('MODTaccount', ""))
            setCustomRolls(result.data.data);
          };
          getDataUser();
        },[setAuthStatus]);
      
        // establish socket connection
        useEffect(() => {
          if (roomConnected) return
          const newSocket = io('https://diceforall.herokuapp.com/Room-'+ room, {"query": {user: getOptions.name, isDM: getOptions.isDM, token: props.cookie.token, dateTz: (new Date()).toString().split('(')[0].split(" ")[5].toUpperCase().substring(3, 6)} }); //http://localhost:5000/Room-
          setSocket(newSocket);
          return () => newSocket.close();
        }, [setSocket, room, roomConnected, props, getOptions]);
       
        // subscribe to the socket event
        useEffect(() => {
          if (!socket) return;
          if(!props.cookie.user) return;
          socket.on('connect', () => {
            setSocketConnected(socket.connected);
            socket.emit("welcome");
          });
          socket.on('disconnect', () => {
            socket.emit("bye");
            setSocketConnected(socket.connected);
          });
          socket.on("time", data => {
            setDt(data);
          });
          socket.on("result", data => {
            setResult(prevResult => [data, ...prevResult]);
          });
          socket.on("customResult", data => {
            setResult(prevResult => [data, ...prevResult]);
          });
          socket.on("welcome", data => {
            setResult(prevResult => [data, ...prevResult]);
          });
          socket.on("bye", data => {
            setResult(prevResult => [data, ...prevResult]);
          });
          socket.on("secretDmRoll", data => {
            setResult(prevResult => [data, ...prevResult]);
          });
          
        }, [socket, props]);
       
        // manage socket connection
        const handleSocketConnection = () => {
          if (socketConnected) {
            setRoomConnected(!roomConnected);
            socket.disconnect();
            setRoom("");
          } else {
            setRoomConnected(!roomConnected);
            
        }
      }

      const getDataUser = async () => {
        const result = await reciveUserDataService();
        setCustomRolls(result.data.data);
      };

      function handleRolls(n) {
        socket.emit("roll", n)
      }

      function handleCustomRolls(n) {
        socket.emit("customRolls", n)
      }

      function handleSecretRoll(faces, result) {
        if (faces === "") return setDmSecretRollFaces("1");
        if (result === "") return setDmSecretRollResult("1");
        if (faces > 1000000) return setDmSecretRollFaces("1000000");
        if (result > 1000000) return setDmSecretRollResult("1000000");
        socket.emit("secretDmRoll", faces, result)
        setDmSecretRollFaces("20");
        setDmSecretRollResult("20");
      }

      function setCustomRollDice() {
        if (crFaces === "") return setCrFaces("1");
        if (crQuantity === "") return setCrQuantity("1");
        if (crFaces > 1000000) return setCrFaces("1000000");
        if (crQuantity > 100) return setCrQuantity("100");
        var rollCustom = {id: id(), qtDado: crQuantity, faces: crFaces, bonus: crBonus, malus: crMalus}
        setCrTot(prevResult => [...prevResult, rollCustom]);
      }

      function resetCustomRollDice() {
        setCrFaces("1");
        setCustomRollName("");
        setCrQuantity("1");
        setCrBonus("0");
        setCrMalus("0");
        setCrTot([]);
      }

      const sendData = async  () => {
        var dataCustomRoll = {
          command: "CUSTOMROLL",
          data: {
          id: id(),
          rollName: customRollName,
          dices: crTot 
        }};
        await sendUserDataService(dataCustomRoll);
        getDataUser();
        resetCustomRollDice();
      }

    const deleteData = async (id) => {
      var deleteCustomRoll = {
        command: "DELETE",
        id: id
      };
      await sendUserDataService(deleteCustomRoll);
      getDataUser();
    }

    return (

    <div className="Room">
    <h1> Hello {props.options[0].name}  </h1>
      {roomConnected ?
      <div>
      <form onClick={(e) => e.preventDefault()}>
      <label>Set your room name or paste the name of an existing one:</label><br/><input type="text" maxLength="30" onChange={(e) => setRoom(e.target.value.replace(/^\s*$/, '').replace(/\s$/g, '').replace(/[^a-zA-Z0-9 ]/g, ''))} value={room} /><br/>
      <input type="submit" onClick={handleSocketConnection} disabled={!room} value={"Connect!"}/>
      </form>
      </div>
      :
      null}

      {!roomConnected ?
      <div>
      <div><b>Connection status:</b> {socketConnected ? 'Connected' : 'Disconnected'}</div>
      <div><b>Room ID:</b> {room}</div>
      <input
        type="button"
        value={socketConnected ? 'Disconnect' : 'Connect'}
        onClick={handleSocketConnection} /><br/>
 
      <div><b>Server Time: </b> {dt}</div>

      <input type="button" onClick={() => handleRolls(2)} value={"Roll a d2 dice!"}/>
      <input type="button" onClick={() => handleRolls(3)} value={"Roll a d3 dice!"}/>
      <input type="button" onClick={() => handleRolls(4)} value={"Roll a d4 dice!"}/>
      <input type="button" onClick={() => handleRolls(6)} value={"Roll a d6 dice!"}/>
      <input type="button" onClick={() => handleRolls(8)} value={"Roll a d8 dice!"}/>
      <input type="button" onClick={() => handleRolls(10)} value={"Roll a d10 dice!"}/>
      <input type="button" onClick={() => handleRolls(12)} value={"Roll a d12 dice!"}/>
      <input type="button" onClick={() => handleRolls(20)} value={"Roll a d20 dice!"}/>
      <input type="button" onClick={() => handleRolls(100)} value={"Roll a d100 dice!"}/>

      <div><b>Result: </b> 
      {result.map(e => 
      <div key={e.id}>
      <div>At {e.time}</div>
      <div>User: {e.username}</div>
      <div>{e.message}</div>
      </div>
      )}
      </div>

      <input type="button" onClick={() => setResult([])} value={"Reset"}/>
      <br/>
      <div><h3><b>Custom Rolls: </b></h3>
      <div>
      <form onClick={(e) => e.preventDefault()}>
        <b>Create your custom roll:</b><br/><br/>
        <label>Name your roll: </label><input type="text" value={customRollName} maxLength="30" onChange={(e) => setCustomRollName(e.target.value.replace(/^\s*$/, ''))}/><br/>
        Create your custom dice:<br/> 
        <label>Faces: </label><input type="number" min={1} value={crFaces} onChange={(e) => { if (e.target.value >= 0) setCrFaces(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
        <label>Num of Rolls: </label><input type="number" min={1} value={crQuantity} onChange={(e) => { if (e.target.value >= 0) setCrQuantity(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
        <label>Bonus: </label><input type="number" min={0} value={crBonus} onChange={(e) => { if (e.target.value >= 0) setCrBonus(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
        <label>Malus: </label><input type="number" min={0} value={crMalus} onChange={(e) => { if (e.target.value >= 0) setCrMalus(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
        <input type="button" value={"Add to the roll"} disabled={crTot.length === 10} onClick={() => setCustomRollDice()}/><br/><br/>
         {crTot.map((e) => 
          <div key={e.id}>
          <div><li>{e.qtDado} d{e.faces} {e.bonus > 0 ? (" + " + e.bonus) : null} {e.malus > 0 ? (" - " + e.malus) : null} <br/></li></div>
          </div>
         )}<br/><br/>
        <input type="submit" value={"Save the custom roll"} disabled={customRollName.length === 0 || crTot.length === 0} onClick={() => sendData()} />
        <input type="button" onClick={() => handleCustomRolls(crTot)} disabled={crTot.length === 0} value={"Roll the custom roll"}/>
        <input type="button" value={"Discard the custom roll"} onClick={() => resetCustomRollDice()}/>
      </form>
      </div>
      <b>Your custom rolls:</b><br/><br/>
      {customRolls.map(e =>
      <div key={e.id}>
      <div><b>Name:</b> {e.rollName} <input type="button" value={"Delete"} onClick={() => deleteData(e.id)}/></div>
      <div><b>Dices: </b></div>
      {e.dices.map (e => 
      <div key={e.id}>
      <div><li>{e.qtDado} d{e.faces} {e.bonus > 0 ? (" + " + e.bonus) : null} {e.malus > 0 ? (" - " + e.malus) : null} <br/></li></div>
      </div>
      )}
      <input type="button" onClick={() => handleCustomRolls(e.dices)} value={"Roll"}/>
      <br/>
      <br/>

      </div>
      )}
      </div>
      {props.options[0].isDM ? 
      <div>
      <b>DM secret roll:</b>
      <br/>
      <label>Faces: </label><input type="number" min={1} value={dmSecretRollFaces} onChange={(e) => { if (e.target.value >= 0) setDmSecretRollFaces(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
      <label>Result: </label><input type="number" min={1} value={dmSecretRollResult} onChange={(e) => { if (e.target.value >= 0) setDmSecretRollResult(e.target.value.replace(/^0+/, '').replace(/\D/g, ''))}} />
      <input type="button" onClick={() => handleSecretRoll(dmSecretRollFaces, dmSecretRollResult)} value={"Roll"}/>
      </div>
    
      : null}
      </div>

      : null}
    </div>

    
)}

export default Room;