import React, { useState } from "react";
import useAsyncEffect from "use-async-effect";
import clientApiServices from "@/services/clientApiServices";
import { Interweave } from "interweave";

export function MaintenanceAlert() {
  const [maintenanceMessageHtml, setMaintenanceMessageHtml] = useState<string | null>(null);

  useAsyncEffect(async _ => {
    try {
      const info = (await clientApiServices.distribrainNodesApi.nodesControllerGetMaintenanceInfo()).data;
      if (info.maintenanceModeActive) {
        setMaintenanceMessageHtml(info.message as unknown as string);
      }
    } catch (err: any) {
      console.error(err);
      setMaintenanceMessageHtml("Service is undergoing maintenance. The Engines Portal might be unresponsive or have limited functionality in that period.");
    }

  }, []);

  if (maintenanceMessageHtml == null)
    return <></>;

  return <>
    <div className="maintenance-message">
      <div className="wrapper">
        <Interweave
          content={maintenanceMessageHtml}
          escapeHtml={false}
          noWrap={true}
        />
      </div>
    </div>

    <div className="maintenance-message-pusher"/>
  </>
}