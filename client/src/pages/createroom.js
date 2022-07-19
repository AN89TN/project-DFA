import React, { useState, useEffect } from 'react';
import { sendUserDataService, reciveUserDataService } from "./../services/auth";
import io from "socket.io-client";

function Room(props) {

        const [cookie, setCookie] = useState([]);
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
        const [getOptions, setOptions] = useState([])

        var id = () => new Date().valueOf().toString(36) + Math.random().toString(36).slice(2);

        useEffect(() => {
          setCookie(props.cookie);
            },[props.cookie]);
   
        useEffect(() => {
          const getDataUser = async () => {
            const result = await reciveUserDataService();
            setCustomRolls(result.data.data);
            setOptions(result.data.options[0]);
          };
          getDataUser();
          
        },[]);
      
        // establish socket connection
        useEffect(() => {
          if (roomConnected) return
          const newSocket = io('http://localhost:5000/Room-'+ room, {"query": {user: getOptions.name, isDM: getOptions.isDM, token: cookie.token} });
          setSocket(newSocket);
          return () => newSocket.close();
        }, [setSocket, room, roomConnected, cookie, getOptions]);
       
        // subscribe to the socket event
        useEffect(() => {
          if (!socket) return;
          if(!cookie.user) return;
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
          
        }, [socket, cookie]);
       
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

    <div >
      {roomConnected ?
      <div>
      <form onClick={(e) => e.preventDefault()}>
      <label>Set your room name or paste the name of an existing one:</label><br/><input type="text" onChange={(e) => setRoom(e.target.value)} value={room} /><br/>
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
 
      <div><b>Time: </b> {dt}</div>

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
      <div key={e.id} style={{border: '1px solid black', width: "50%", textAlign : "center", display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: "5px"}}>
      <div style={{border: '1px solid black', width: "50%", textAlign : "center", display: 'flex', alignItems: 'center', justifyContent: 'center'}}>At {e.time}</div>
      <div style={{border: '1px solid black', width: "50%", textAlign : "center", display: 'flex', alignItems: 'center', justifyContent: 'center'}}>User: {e.username}</div>
      <div style={{border: '1px solid black', width: "50%", textAlign : "center", display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{e.message}</div>
      </div>
      )}
      </div>

      <input type="button" onClick={() => setResult([])} value={"Reset"}/>
      <br/>
      <div><h3><b>Custom Rolls: </b></h3>
      <div>
      <form onClick={(e) => e.preventDefault()}>
        <b>Create your custom roll:</b><br/><br/>
        <label>Name your roll: </label><input type="text" value={customRollName} onChange={(e) => setCustomRollName(e.target.value)}/><br/>
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
        <input type="submit" value={"Save the custom roll"} disabled={crTot.length === 0} onClick={() => sendData()} />
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
      </div>

      :
      null}

      



    </div>

    
)}

export default Room;