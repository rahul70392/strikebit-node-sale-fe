import Image from "next/image"
import { UserRound, MessageCircleMore } from 'lucide-react';
import logo1 from "../../assets/images/logo1.png";
import discordBlue from "../../assets/images/discord-blue.svg"
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { routes } from "@/data/routes";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import { useState, useEffect } from "react";
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { Menu } from 'lucide-react';

export const Navbar = () => {
    const user = useUser();
    const router = useRouter();
    const [userName, setUserName] = useState<string>("");

    const [selectedValue, setSelectedValue] = useState<string>('');

    // const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //     setSelectedValue(event.target.value);
    // };

    // useEffect(() => {
    //     if (selectedValue === "logout") {
    //         onLogoutClicked();
    //     }
    // }, [selectedValue]);

    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleChange = (value: string) => {
        if (value === "logout") {
            onLogoutClicked();
        }
        setIsOpen(false);
    };

    const onLogoutClicked = async () => {
        try {
            toast.info("Signing out...");
            await router.push(routes.auth.logout());
        } catch (error) {
            toast.error("Logout failed. Please try again.");
            console.error(error);
        }
    };

    const [open, setOpen] = useState(false);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const DrawerList = (
        <div className="" style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }}>
            {/* discord button */}
            <button className=""
                style={{
                    background: "transparent",
                    padding: "16px 16px",
                    border: "1px solid #1214FD"
                }}
            >
                <Image
                    src={discordBlue}
                    alt="join our discord"
                    height={18.85}
                    width={24.35}
                />
            </button>
            {/* upgrade pro button */}
            <button
                style={{
                    backgroundColor: "#1214FD",
                    color: "white",
                    padding: "16px 28px",
                    fontWeight: "700",
                    border: "0"
                }}
            >Upgrade Pro</button>
            {/* user details select tab */}
            <div
                style={{
                    background: "none",
                    border: "none",
                    padding: "8px 16px",
                    cursor: "pointer",
                    textAlign: "center",
                    width: "100%",
                    color: "black",
                    fontWeight: "bold"
                }}
            >
                {user.user!.picture && (
                    <Image
                        src={user.user!.picture!}
                        alt="Avatar"
                        width={100}
                        height={100}
                        unoptimized
                        className="rounded-circle"
                        style={{
                            width: "2rem",
                            height: "2rem",
                            marginLeft: "-0.5rem",
                            marginRight: "0.5rem",
                        }}
                    />
                )}
                {user.user?.name}
            </div>

            <button
                className="text-center text-white bg-dark-gray"
                onClick={() => handleChange('accountDetails')}
                style={{
                    width: "100%",
                    padding: "8px",
                    cursor: "pointer",
                    border: "none"
                }}
            >
                Account Details
            </button>

            <button
                className="text-center"
                onClick={() => handleChange('logout')}
                style={{
                    backgroundColor: "#C41414",
                    color: "white",
                    width: "100%",
                    padding: "8px",
                    cursor: "pointer",
                    border: "none"
                }}
            >
                LogOut
            </button>
        </div>
    );

    return (
        <nav className="d-flex align-items-center justify-content-between">

            {/* logo */}
            <Image
                src={logo1}
                alt="StrikeBit"
                height={100}
                width={100}
                className=""
            />

            {/* buttons */}
            <div>
                <div className="d-none d-md-flex align-items-center gap-3">
                    {/* discord button */}
                    <button className=""
                        style={{
                            background: "transparent",
                            padding: "16px 16px",
                            border: "1px solid #1214FD"
                        }}
                    >
                        <Image
                            src={discordBlue}
                            alt="join our discord"
                            height={18.85}
                            width={24.35}
                        />
                    </button>
                    {/* upgrade pro button */}
                    <button
                        style={{
                            backgroundColor: "#1214FD",
                            color: "white",
                            padding: "16px 28px",
                            fontWeight: "700",
                            border: "0"
                        }}
                    >Upgrade Pro</button>
                    {/* user details select tab */}
                    <Box sx={{ minWidth: 120 }}>
                        <FormControl fullWidth>
                            <div
                                style={{
                                    position: "relative"
                                }}
                            >
                                <button className="dropdown-btn text-white"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px 16px",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        width: "100%"
                                    }}
                                    onClick={toggleDropdown}>
                                    {user.user!.picture && (
                                        <Image
                                            src={user.user!.picture!}
                                            alt="Avatar"
                                            width={100}
                                            height={100}
                                            unoptimized
                                            className="rounded-circle"
                                            style={{
                                                width: "2rem",
                                                height: "2rem",
                                                marginLeft: "-0.5rem",
                                                marginRight: "0.5rem",
                                            }}
                                        />
                                    )}
                                    {user.user?.name}
                                </button>
                                {isOpen && (
                                    <div
                                        className=""
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "0",
                                            width: "100%",
                                            backgroundColor: "black",
                                            border: "1px solid gray",
                                            zIndex: "1"
                                        }}
                                    >
                                        <button
                                            className="text-center text-white"
                                            onClick={() => handleChange('accountDetails')}
                                            style={{
                                                backgroundColor: "transparent",
                                                width: "100%",
                                                padding: "8px",
                                                cursor: "pointer",
                                                border: "none"
                                            }}
                                        >
                                            Account Details
                                        </button>
                                        <button
                                            className="text-center"
                                            onClick={() => handleChange('logout')}
                                            style={{
                                                backgroundColor: "#C41414",
                                                color: "white",
                                                width: "100%",
                                                padding: "8px",
                                                cursor: "pointer",
                                                border: "none"
                                            }}
                                        >
                                            LogOut
                                        </button>
                                    </div>
                                )}
                            </div>
                        </FormControl>
                    </Box>
                </div >

                <div className="d-block d-md-none">
                    <Button onClick={toggleDrawer(true)}>
                        <Menu size={36} color="white" />
                    </Button>
                    <Drawer open={open} onClose={toggleDrawer(false)}>
                        {DrawerList}
                    </Drawer>
                </div>
            </div>
        </nav >
    )
}
