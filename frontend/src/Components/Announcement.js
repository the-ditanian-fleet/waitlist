import { InfoNote } from "./NoteBox";
import { useApi } from "../api";
import { formatDatetime } from "../Util/time";



export function InfoAnnouncement({id}){
	const [announcement] = useApi(`/api/announcement/read?id=${id}`);
	if (announcement === null) {
    return null;
  }
	console.log(announcement);
	if (announcement.message === ""){
		return null;
	}
	return(
	
	<InfoNote>
	<div>
	<div>{formatDatetime(new Date(announcement.created_at * 1000))} by {announcement.created_by} </div>
	<div>{announcement.message}</div>
	</div>
	
	</InfoNote>)
}