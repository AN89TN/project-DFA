import React from "react";

function Home(props) {

    return (
        <div className="Home">
        <h1> Hello Home {props.options[0].name} </h1>
        </div>
    )
}

export default Home;