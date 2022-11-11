import "./App.css";
import axios from "axios";
import MapMaker from "./Pages/MapMaker";
import InGame from "./Pages/InGame";
import { useEffect, useState, useRef } from "react";
import SOCKET_EVENTS from "./SOCKET_EVENTS";
import DuplicateTab from "./DuplicateTab";
import {
    MODULES,
    CHAIN,
    MAP_WIDTH as width,
    MAP_HEIGHT as height,
    ORCH_URL
} from "./consts";
import ProgressIndicator from "./ProgressIndicator";
import PlaceCompulsory from "./Pages/PlaceCompulsory";
import InQueue from "./Pages/InQueue";
import OfflinePopup from "./OfflinePopup";
import Footer from "./Footer";

axios.defaults.baseURL =
    (process.env.NODE_ENV === "development" ? "http://" : "https://") +
    ORCH_URL.replace(/www./g, ""); // remove any www.
axios.defaults.withCredentials = true;

function App() {
    const [isDuplicatePage, setIsDuplicatePage] = useState(false);
    const [currentModule, setCurrentModule] = useState(0);
    const [tiles, setTiles] = useState(
        [...Array(width)].map((_) => Array(height).fill(null))
    );
    const [compulsoryBlockPlacements, setCompulsoryBlockPlacements] = useState(
        []
    );
    const [validatedMapToken, setValidatedMapToken] = useState();
    const [tools, setTools] = useState();
    const [compulsoryTools, setCompulsoryTools] = useState();
    const [isOnline, setIsOnline] = useState(false);

    const socketRef = useRef();

    const nextModule = () => {
        const newModule = currentModule + 1;
        setCurrentModule(newModule);
    };

    const backModule = () => {
        const newModule = currentModule - 1;
        setCurrentModule(newModule);
    };

    const fetchTools = async () => {
        try {
            const tools = (await axios.get("/tools"))?.data;
            const newCompulsoryTools = { ...tools };
            Object.entries(newCompulsoryTools).forEach(([key, tool]) => {
                if (tool?.category === "compulsory") {
                    delete tools[key];
                } else {
                    delete newCompulsoryTools[key];
                }
            });
            setTools(tools);
            setCompulsoryTools(newCompulsoryTools);
        } catch (e) {
            console.log(e);
            alert("Could not fetch tools from server!");
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await axios.get("/start-session");
                setIsOnline(true);
            } catch (e) {
                console.log("Could not establish connection to server");
                setIsOnline(false);
            }
            await fetchTools();
        })();
    }, []);

    return (
        <div className="App">
            {isDuplicatePage && (
                <DuplicateTab
                    setAsMain={() => {
                        setIsDuplicatePage(false);
                        socketRef.current.emit(SOCKET_EVENTS.SET_PRIMARY);
                    }}
                />
            )}
            {!isOnline && <OfflinePopup />}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%"
                }}
            >
                <div style={{ borderBottom: "1px solid black" }}>
                    <ProgressIndicator currentModule={currentModule} />
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {CHAIN[currentModule] === MODULES.MAP_MAKER ? (
                        <MapMaker
                            nextModule={isOnline ? nextModule : null}
                            backModule={backModule}
                            tiles={tiles}
                            setTiles={setTiles}
                            width={width}
                            tools={tools}
                            setTools={setTools}
                        />
                    ) : CHAIN[currentModule] === MODULES.PLACE_REQUIRED ? (
                        <PlaceCompulsory
                            tiles={tiles}
                            compulsoryTools={compulsoryTools}
                            nextModule={nextModule}
                            backModule={backModule}
                            setTiles={setTiles}
                            socketRef={socketRef}
                            compulsoryBlockPlacements={
                                compulsoryBlockPlacements
                            }
                            setCompulsoryBlockPlacements={
                                setCompulsoryBlockPlacements
                            }
                        />
                    ) : CHAIN[currentModule] === MODULES.IN_QUEUE ? (
                        <InQueue
                            socketRef={socketRef}
                            backModule={backModule}
                            nextModule={nextModule}
                            setIsDuplicatePage={setIsDuplicatePage}
                            tiles={tiles}
                            setValidatedMapToken={setValidatedMapToken}
                        />
                    ) : CHAIN[currentModule] === MODULES.IN_GAME ? (
                        <InGame
                            socketRef={socketRef}
                            tiles={tiles}
                            validatedMapToken={validatedMapToken}
                        />
                    ) : (
                        <></>
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default App;
