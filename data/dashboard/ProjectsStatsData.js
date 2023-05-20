import {
	Briefcase,
    ListTask,
    People,
    Bullseye
} from 'react-bootstrap-icons';

export const ProjectsStats = [
    {
       id:1,
       title : "Projects",
       value : 1,
       icon: <Briefcase size={18}/>,
      //  statInfo: '<span className="text-dark me-2">1</span> Completed' 
    },
   //  {
   //      id:2,
   //      title : "Tasks",
   //      value : 132,
   //      icon: <ListTask size={18}/>,
   //      statInfo: '<span className="text-dark me-2">28</span> Completed' 
   //   },
     {
        id:3,
        title : "Collaborators",
        value : 2,
        icon: <People size={18}/>,
      //   statInfo: '<span className="text-dark me-2">1</span> Recruiting' 
     },
   //   {
   //      id:4,
   //      title : "Productivity",
   //      value : '76%',
   //      icon: <Bullseye size={18}/>,
   //      statInfo: '<span className="text-dark me-2">5%</span> Completed' 
   //   }
];
export default ProjectsStats;
