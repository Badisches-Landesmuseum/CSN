import React, { Component } from 'react'
import PreviewPane from './PreviewPane'
import SliderPane from './SliderPane'
import FilterPane from './FilterPane'
import InfoPane from './InfoPane'
import ViewPane from './ViewPane'
import MappingsPane from './MappingsPane'
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import './scss/Menu.scss';
import Projection from './Projection'
import * as _ from 'lodash'
import { CircularProgress } from "@material-ui/core";
import { Grid } from "@material-ui/core";

class Layout extends Component {
  constructor(props) {
    super(props)
    let total = this.props.settings["total"]
    this.state = {
      ww: null,
      wh: null,
      hover_index: 0,
      previewPane_height: null,
      controlPane_height: null,
      filterPane_height: null,
      algorithm_choice: null,
      allFilter: {},
      currentProjection: new Float32Array(total).fill(0),
      currentFilter: new Float32Array(total).fill(0),
      currentSearch: new Float32Array(total).fill(0),
      scaleMin: 14,
      scaleMax: 70,
      clusterTypeSelected:'-',
      // filterDataToExportCSV:[]
    }
    this.previewPane_ctx = null;
    this.setSize = _.debounce(this.setSize.bind(this), 200);
    this.setPreviewPaneCanvas = this.setPreviewPaneCanvas.bind(this);
    this.selectAlgorithm = this.selectAlgorithm.bind(this);
    this.selectDataset = this.selectDataset.bind(this);
    this.refProjection = React.createRef();
  }

  componentDidMount() {
    this.selectAlgorithm(this.props.algorithm_name);
    this.setSize();
    window.addEventListener('resize', this.setSize);
    this.calcDefaultScale();
  }


  calcDefaultScale(){
    if (this.props.settings["total"] < 10000) {
      this.setState( { scaleMin: 15 } )} else {
      this.setState( { scaleMin: 5 } )
      }
  }

  handleChangeScale(e,val) {
    this.setState({ scaleMin: val})
  }

  handleChangeZoom(e,val) {
    this.setState({ scaleMax: val})
  }

  handleChangeCluster(e) {
    let value = e.target.value;
    this.setState({ clusterTypeSelected: value})
    try{
      this.refProjection.current.updateClusterColors(value)
    } catch(error) {console.log("error updateClusterColors")}
  }

  calculateProjection=(newArr,type, update)=>{
    let A, B, arr;
    if(type==="filter"){
      this.setState({currentFilter: newArr})
      A = newArr;
      B = this.state.currentSearch;
    }
    if(type==="search"){
      this.setState({currentSearch: newArr});
      A = this.state.currentFilter;
      B = newArr;
    }
    if(update){
      arr = A.map((x, idx) => x + B[idx]);
      this.setState({currentProjection: arr});
    } else {
      arr = newArr;
    }
    try{
      this.refProjection.current.updateProjection(arr);
    } catch(error) {}
    
    // // Release memory of export filter metadata
    // if(this.state.filterDataToExportCSV.length>0) this.setState({filterDataToExportCSV: []});
  }

  selectAlgorithm(v) {
    let i = this.props.algorithm_options.indexOf(v);
    if(i<0) i = 0;
    this.setState({ algorithm_choice: i });
    // Save algorithm in URL parameters
    this.props.addToUrl('projection',this.props.algorithm_options[i]);
  }

  selectDataset(p) {
    this.props.changeDataset(p);
  }

  setSize() {
    this.setState({ ww: window.innerWidth, wh: window.innerHeight });
    let previewPane_height = this.previewPane_mount.offsetHeight;
    this.setState({ previewPane_height: previewPane_height });

    if (this.previewPane_ctx) this.previewPane_ctx.imageSmoothingEnabled = false;
  }

  setPreviewPaneCanvas(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.previewPane_ctx = ctx;
    console.log(ctx);
  }
  
  setHoverIndex(hover_index) {
    if (hover_index){
      this.setState({ hover_index: hover_index });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }
  

  render() {
    let {
      embeddings_data,
      mappings,
      algorithm_options,
      dataset_options,
      metadata,
      settings,
      barData,
      clusterTypeSelected
    } = this.props;

    let {
      ww,
      wh,
      hover_index,
      algorithm_choice,
      currentProjection,
      allFilter,
      // filterDataToExportCSV
    } = this.state;

    let previewPane_ctx = this.previewPane_ctx;
    
    let line_height = 1.5;

    let previewPane_style = {
      position: 'absolute',
      left: 0,
      top: 0,
      background: '#222',
      flexDirection: 'column',
      zIndex: 10
    };
    let controlMenu_style = {
      position: 'absolute',
      right: 0,
      top: 0,
      height: 'auto',
      maxHeight: '100vh',
      overflow: 'auto',
      background: '#222',
      zIndex: 11
    };

    let main_style = {
      position: 'relative',
      height: '100vh',
      background: '#111',
      overflow: 'hidden',
    };

    let previewPane_image_size;

    let font_size = 16;
    if (ww < 800) {
      font_size = 14;
      previewPane_style = {
        ...previewPane_style,
        flexDirection: 'row',
        width: '100%',
        top: 'auto',
        height: 'auto',
        bottom: 0,
      };
      main_style = { width: ww, height: wh };
      previewPane_image_size = font_size * line_height * 3;
    } else if (ww < 800 + 600) {
      let scaler = 200 + (300 - 200) * ((ww - 800) / 600);
      font_size = 14 + 2 * ((ww - 800) / 600);
      previewPane_style = {
        ...previewPane_style,
        width: scaler,
      };

      previewPane_image_size = previewPane_style.width;
      main_style = {
        ...main_style,
        width: ww,
        height: wh,
      };
    } else {
      previewPane_style = {
        ...previewPane_style,
        width: 300,
      };
      main_style = {
        ...main_style,
        width: ww,
        height: wh,
      };
      previewPane_image_size = previewPane_style.width;
    }

    let grem = font_size * line_height;

    let general_style = {
      fontSize: font_size,
      lineHeight: line_height,
    };

    return ww !== null ? (
      <div style={general_style}>
        <div
          style={controlMenu_style}
          ref={controlMenu_mount => {
            this.controlMenu_mount = controlMenu_mount
          }}
        >
          <div>
          <ProSidebar>
            <Menu iconShape="square">
              <SubMenu title="Data & Mapping" defaultOpen="True">
              <MenuItem>
              <MappingsPane
                grem={grem}
                algorithm_options={algorithm_options}
                algorithm_choice={algorithm_choice}
                selectAlgorithm={this.selectAlgorithm}
                dataset_options={dataset_options}
                selectDataset={this.selectDataset}
                selectedDataset={this.props.selectedDataset}
                datasetInfo={settings["datasetInfo"]}
              />
              </MenuItem>
              </SubMenu>
              <SubMenu title="Range Sliders" defaultOpen="True">
                <MenuItem>
                <SliderPane
                grem={grem}
                metadata={metadata}
                hover_index={hover_index}
                settings={settings}
                barData={barData}
                calculateProjection={this.calculateProjection}
                currentProjection={currentProjection}
                allFilter={allFilter}
              />
                </MenuItem>
                </SubMenu>
                <SubMenu title="Advanced Filters" style={{overflow:"visible"}}>
                <MenuItem>
                  <FilterPane
                    grem={grem}
                    calculateProjection={this.calculateProjection}
                    hover_index={hover_index}
                    settings={settings}
                    metadata={metadata}
                    currentProjection={currentProjection}
                    allFilter={allFilter}
                    // filterDataToExportCSV={filterDataToExportCSV}
                  />
                </MenuItem>
              </SubMenu>
            </Menu>
          </ProSidebar>
          </div>
        </div>    

        <div
          style={previewPane_style}
          ref={previewPane_mount => {
            this.previewPane_mount = previewPane_mount
          }}
        >
          <ProSidebar
            width={previewPane_image_size}>
            <Menu iconShape="square">
            <SubMenu title="Collection Space Navigator" 
              >
              <div className='about'>
                <h3>Interactive Visualization Interface for Multidimensional Datasets</h3>
                The Collection Space Navigator (CSN) is an explorative visualization tool for researching collections and their multidimensional representations. 
                We designed this tool to better understand multidimensional data, its methods, and semantic qualities through spatial navigation and filtering. 
                CSN can be used with any image collection and can be customized for specific research needs. <a href="https://github.com/Collection-Space-Navigator/CSN" target="blank">[more on GitHub...]</a>
                
              </div>
              </SubMenu>
              <SubMenu title="Preview" defaultOpen="True" 
              >
                <PreviewPane
                  previewPane_image_size={previewPane_image_size}
                  setPreviewPaneCanvas={this.setPreviewPaneCanvas}
                  prevURL={settings.url_prefix + metadata[hover_index].URL}
                />
              </SubMenu>
              <SubMenu title="Info" defaultOpen="True" >
                <MenuItem>
                <InfoPane
                  hover_index={hover_index}
                  metadata={metadata}
                  infos={settings.info}
                />
                </MenuItem>
              </SubMenu>
              <SubMenu title="View Settings" >
                <MenuItem>
                <ViewPane
                  clusters={settings.clusters}
                  scaleMin={this.state.scaleMin}
                  scaleMax={this.state.scaleMax}
                  handleChangeScale = {this.handleChangeScale.bind(this)}
                  handleChangeZoom = {this.handleChangeZoom.bind(this)}
                  handleChangeCluster = {this.handleChangeCluster.bind(this)}
                  total = {settings.total}
                />
                </MenuItem>
              </SubMenu>
            </Menu>
          </ProSidebar>
          
        </div>
        <div style={main_style}>
          <Projection
            ref={this.refProjection}
            width={main_style.width}
            height={main_style.height}
            embeddings_data={embeddings_data}
            mappings={mappings}
            metadata={metadata}
            previewPane_ctx={previewPane_ctx}
            previewPane_image_size={previewPane_image_size}
            setHoverIndex={this.setHoverIndex.bind(this)}
            algorithm_choice={algorithm_choice}
            datasetDir={this.props.datasetDir}
            clusterTypeSelected={clusterTypeSelected}
            settings={settings}
            initPath={this.props.initPath}
            scaleMin={this.state.scaleMin}
            scaleMax={this.state.scaleMax}
            currentProjection={currentProjection}
            // tiles={this.tiles}
          />
        </div>
      </div>
      
    ) : (
      <div className="loading" ><CircularProgress color="inherit"/><div>loading layout...</div></div>
    )
  }
}

export default Layout



