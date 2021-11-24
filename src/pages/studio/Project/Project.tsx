// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { Redirect, Route, Switch, useHistory, useParams } from 'react-router';
import Modal from 'react-modal';
import { NavLink } from 'react-router-dom';
import { ProjectDetail, ProjectHeader, NewDeployment, Button, Spinner } from '../../../components';
import { useCreateDeployment, useProject } from '../../../hooks';
import { NewDeployment as NewDeploymentParams } from '../../../models';
import { useWeb3 } from '../../../containers';
import styles from './Project.module.css';
import { renderAsync } from '../../../utils';
import DeploymentsTab from './Deployments';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '10px',
  },
  overlay: {
    zIndex: 50,
  },
};

const Project: React.VFC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { account } = useWeb3();
  const asyncProject = useProject(id);

  const [deploymentModal, setDeploymentModal] = React.useState<boolean>(false);
  const createDeployment = useCreateDeployment(id);

  const handleSubmitCreate = async (details: NewDeploymentParams) => {
    await createDeployment(details);

    setDeploymentModal(false);
  };

  const handleNewDeployment = () => setDeploymentModal(true);

  const handleEditMetadata = () => history.push(`/studio/project/edit/${id}`);

  return renderAsync(asyncProject, {
    loading: () => <Spinner />,
    error: (error: Error) => <span>{`Failed to load project: ${error.message}`}</span>,
    data: (project) => {
      if (!project) {
        // Should never happen
        return <span>Project doesn't exist</span>;
      }

      if (project.owner !== account) {
        return <Redirect to="/studio" />;
      }

      return (
        <div>
          <Modal isOpen={deploymentModal} style={customStyles} onRequestClose={() => setDeploymentModal(false)}>
            <NewDeployment onSubmit={handleSubmitCreate} />
          </Modal>
          <ProjectHeader project={project} />
          <div className="tabContainer">
            <NavLink to={`/studio/project/${id}/details`} className="tab" activeClassName="tabSelected" title="Details">
              Details
            </NavLink>
            <NavLink
              to={`/studio/project/${id}/deployments`}
              className="tab"
              activeClassName="tabSelected"
              title="Deployments"
            >
              Deployments
            </NavLink>
          </div>
          <Switch>
            <Route exact path={`/studio/project/:id/details`}>
              {project.metadata && <ProjectDetail metadata={project.metadata} onEdit={handleEditMetadata} />}
            </Route>
            <Route exact path={`/studio/project/:id/deployments`}>
              <div className={styles.deployments}>
                <DeploymentsTab
                  projectId={id}
                  currentDeployment={project && { deployment: project.deployment.id, version: project.version }}
                />
                <Button
                  type="primary"
                  label="Create new deployment"
                  className={styles.deployButton}
                  onClick={handleNewDeployment}
                />
              </div>
            </Route>
            <Redirect from="/:id" to={`${id}/details`} />
          </Switch>
        </div>
      );
    },
  });
};

export default Project;
